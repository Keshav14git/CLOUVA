import React, { useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { storage, databases, BUCKET_FILES, DATABASE_ID, COLLECTION_FILES } from '../lib/appwrite';
import { model } from '../lib/gemini';
import { generateEmbedding } from '../lib/semantic';
import { ID, Permission, Role } from 'appwrite';
import { useAuth } from '../context/AuthContext';

const FileUpload = ({ onUploadComplete }) => {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });
  const [uploadProgress, setUploadProgress] = useState({
    currentFile: '',
    step: '', // 'extracting', 'extracted', 'embedding', 'completed'
    fileIndex: 0,
    totalFiles: 0
  });

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper: Generate Categories using Gemini AI
  const generateCategories = async (text) => {
    try {
      if (!text || text.length < 50) return [];

      const prompt = `Analyze the following text and generate a list of 1-3 specific, single-word categories or tags that best describe its content. 
      Examples: "Finance", "Legal", "Physics", "Resume", "Code", "Health".
      Return ONLY a valid JSON array of strings. Do not include markdown formatting or backticks.
      
      Text sample:
      ${text.slice(0, 2000)}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text().trim().replace(/```json|```/g, ''); // Clean markdown if present

      const categories = JSON.parse(textResponse);
      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      console.error("AI Categorization failed:", error);
      return [];
    }
  };

  // Helper: Extract Text
  const extractText = async (file) => {
    try {
      if (file.type === 'application/pdf') {
        const { getDocument, GlobalWorkerOptions, version } = await import('pdfjs-dist');
        // Use exact version from package or fallback to 5.4.449
        const workerVersion = version || '5.4.449';
        GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${workerVersion}/build/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + "\n";
        }
        return text;
      }
      else if (file.type.includes('word') || file.name.endsWith('.docx')) {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      }
      else if (file.type.includes('text') || file.type.includes('json')) {
        return await file.text();
      }
    } catch (e) {
      console.error("Text extraction failed:", e);
    }
    return ""; // Fallback
  };

  const uploadFiles = async () => {
    if (!user) {
      setErrorModal({ show: true, message: 'You must be logged in to upload files.' });
      return;
    }

    setUploading(true);
    try {
      const totalFiles = files.length;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 1. Extract Text (Client Side)
        setUploadProgress({
          currentFile: file.name,
          step: 'extracting',
          fileIndex: i + 1,
          totalFiles
        });
        console.log(`Extracting text for ${file.name}...`);
        const extractedText = await extractText(file);
        console.log(`Extracted ${extractedText.length} chars.`);

        setUploadProgress(prev => ({ ...prev, step: 'extracted' }));

        if (!extractedText || extractedText.trim().length === 0) {
          setErrorModal({
            show: true,
            message: `Warning: No text could be extracted from "${file.name}".\n\n1. It might be a scanned PDF (images only).\n2. Or the text extraction failed.\n\nThe ChatBot will NOT be able to read this file.`
          });
        }

        // 1.5 Generate AI Categories
        // console.log(`Generating AI categories...`);
        // const aiCategories = await generateCategories(extractedText);
        // console.log(`Generated Categories:`, aiCategories);

        // 1.6 Generate Embedding (Smart Search)
        setUploadProgress(prev => ({ ...prev, step: 'embedding' }));
        console.log(`Generating Embedding...`);
        // Truncate to ~1000 chars for embedding to capture the "gist" / intro
        // MiniLM has a token limit, so passing the whole book is wasteful and ignored after ~512 tokens
        const embeddingText = extractedText.slice(0, 2000);
        const embeddingVector = await generateEmbedding(embeddingText);
        console.log(`Embedding generated. Length: ${embeddingVector?.length}`);

        setUploadProgress(prev => ({ ...prev, step: 'completed' }));

        const permissions = [
          Permission.read(Role.user(user.$id)),
          Permission.write(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ];

        // 2. Upload file to Appwrite Storage
        const fileUpload = await storage.createFile(
          BUCKET_FILES,
          ID.unique(),
          file,
          permissions
        );

        // 3. Get File View URL
        const fileUrl = storage.getFileView(BUCKET_FILES, fileUpload.$id);
        let finalUrl = '';
        if (typeof fileUrl === 'string') {
          finalUrl = fileUrl;
        } else if (fileUrl && fileUrl.href) {
          finalUrl = fileUrl.href;
        }

        // 4. Create metadata document in Database
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_FILES,
          ID.unique(),
          {
            name: file.name,
            fileId: fileUpload.$id,
            size: file.size,
            type: file.type,
            url: finalUrl,
            bucketId: BUCKET_FILES,
            status: 'processed', // MARK AS PROCESSED IMMEDIATELY
            extractedText: extractedText, // SAVE TEXT DIRECTLY
            embedding: JSON.stringify(embeddingVector), // SAVE EMBEDDING
            // ai_categories: aiCategories // SAVE AI CATEGORIES (Disabled: Attribute missing in DB)
          },
          permissions
        );
      }
      setFiles([]);
      setUploadProgress({ currentFile: '', step: '', fileIndex: 0, totalFiles: 0 });
      setShowSuccessModal(true);
      // onUploadComplete will be called when user closes the modal
    } catch (error) {
      console.error('Upload failed:', error);
      if (error.code === 400) {
        setErrorModal({ show: true, message: 'Upload failed: Bad Request (400). Please check your Appwrite database attributes.' });
      } else {
        setErrorModal({ show: true, message: 'Upload failed: ' + error.message });
      }
    } finally {
      setUploading(false);
      setUploadProgress({ currentFile: '', step: '', fileIndex: 0, totalFiles: 0 });
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        className={`w-full h-40 flex flex-col items-center justify-center rounded-lg border border-dashed transition-all cursor-pointer ${isDragging
          ? 'border-zinc-500 bg-zinc-100'
          : 'border-zinc-300 bg-zinc-50 hover:bg-white hover:border-zinc-400'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
          <Upload size={24} className="text-zinc-400 mb-2" />
          <p className="text-sm font-medium text-zinc-700">Drop files here or click to browse</p>
          <p className="text-xs text-zinc-400 mt-1">PDF, DOCX, PPT, Images</p>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 uppercase font-semibold tracking-wider">
            <span>Selected Files ({files.length})</span>
          </div>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-white border border-border rounded-md shadow-sm">
                <File size={16} className="text-zinc-400" />
                <span className="flex-1 text-sm text-zinc-700 truncate">{file.name}</span>
                <span className="text-xs text-zinc-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                <button onClick={() => removeFile(index)} className="text-zinc-400 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Progress Indicator */}
          {uploading && uploadProgress.step && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-blue-900">
                  Processing {uploadProgress.currentFile}
                </span>
                <span className="text-blue-600 text-xs">
                  {uploadProgress.fileIndex} of {uploadProgress.totalFiles}
                </span>
              </div>

              <div className="space-y-2">
                {/* Step 1: Extracting Text */}
                <div className="flex items-center gap-2 text-sm">
                  {uploadProgress.step === 'extracting' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-blue-700">Extracting text...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-green-700">Text extracted</span>
                    </>
                  )}
                </div>

                {/* Step 2: Generating Embeddings */}
                {(uploadProgress.step === 'embedding' || uploadProgress.step === 'completed') && (
                  <div className="flex items-center gap-2 text-sm">
                    {uploadProgress.step === 'embedding' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-blue-700">Generating embeddings...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-green-700">Embeddings generated</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload to Vault'}
          </button>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
            <div className="text-center space-y-4">
              {/* Success Icon */}
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Message */}
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                  Upload Successful!
                </h3>
                <p className="text-zinc-600">
                  Your files have been uploaded and processed successfully.
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onUploadComplete) onUploadComplete();
                }}
                className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error/Warning Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
            <div className="text-center space-y-4">
              {/* Error Icon */}
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              {/* Message */}
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                  {errorModal.message.includes('Warning') ? 'Warning' : 'Error'}
                </h3>
                <p className="text-zinc-600 whitespace-pre-line text-sm">
                  {errorModal.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setErrorModal({ show: false, message: '' })}
                className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
