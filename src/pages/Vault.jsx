import React, { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import NotificationModal from '../components/NotificationModal';
import { Plus, Trash2, File, FileText, Image as ImageIcon, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { databases, storage, DATABASE_ID, COLLECTION_FILES, BUCKET_FILES } from '../lib/appwrite';
import { useNavigate } from 'react-router-dom';

const Vault = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [notification, setNotification] = useState({ show: false, type: 'success', title: '', message: '' });
  const navigate = useNavigate();

  const filteredFiles = selectedCategory === 'All'
    ? files
    : files.filter(file => file.ai_categories && file.ai_categories.includes(selectedCategory));

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_FILES
      );
      setFiles(response.documents.reverse());
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUploadComplete = () => {
    setShowUpload(false);
    fetchFiles();
  };

  const handleDelete = async (e, file) => {
    e.stopPropagation(); // Prevent opening file
    if (!window.confirm(`Are you sure you want to delete "${file.name}"? This cannot be undone.`)) return;

    try {
      // 1. Delete from Database (Metadata + Text)
      await databases.deleteDocument(DATABASE_ID, COLLECTION_FILES, file.$id);

      // 2. Delete from Storage (Actual File)
      // Note: We used fileId field to store bucket file ID
      if (file.fileId) {
        await storage.deleteFile(BUCKET_FILES, file.fileId);
      }

      setFiles(prev => prev.filter(f => f.$id !== file.$id));
      setNotification({ show: true, type: 'success', title: 'Success', message: 'File deleted successfully.' });
    } catch (error) {
      console.error('Delete failed:', error);
      setNotification({ show: true, type: 'error', title: 'Error', message: 'Failed to delete file. It might already be gone.' });
    }
  };

  const getFileIcon = (type) => {
    if (type.includes('image')) return <ImageIcon size={20} className="text-red-600" />;
    if (type.includes('pdf')) return <FileText size={20} className="text-red-700" />;
    return <File size={20} className="text-zinc-400" />;
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">My Vault</h2>
          <p className="text-zinc-500">Manage and organize your knowledge assets.</p>
        </div>
        <button
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-red-800 transition-all shadow-md shadow-red-900/10 hover:shadow-red-900/20 active:scale-95"
          onClick={() => setShowUpload(!showUpload)}
        >
          <motion.div
            animate={{ rotate: showUpload ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus size={20} />
          </motion.div>
          {showUpload ? 'Close' : 'Upload File'}
        </button>
      </div>

      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-6">
              <FileUpload onUploadComplete={handleUploadComplete} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filter */}
      {!loading && files.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCategory === 'All'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
              }`}
          >
            All Files
          </button>
          {Array.from(new Set(files.flatMap(f => f.ai_categories || []))).sort().map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCategory === category
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Render-Style Table View */}
      <div className="border border-border rounded-lg bg-white overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-50/50 border-b border-border text-xs font-bold text-zinc-500 uppercase tracking-wider">
          <div className="col-span-12 md:col-span-5 lg:col-span-6">Name</div>
          <div className="col-span-2 hidden md:block">Type</div>
          <div className="col-span-2 hidden md:block">Size</div>
          <div className="col-span-3 md:col-span-3 lg:col-span-2 text-right">Created</div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader className="animate-spin text-zinc-400" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500">No files found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredFiles.map((file) => (
              <motion.div
                layout
                key={file.$id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => navigate(`/file/${file.$id}`)}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-zinc-50 transition-colors cursor-pointer group"
              >
                {/* Name Column */}
                <div className="col-span-12 md:col-span-5 lg:col-span-6 flex items-center gap-3 overflow-hidden">
                  <div className="flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-zinc-900 truncate group-hover:text-primary transition-colors">
                      {file.name}
                    </h3>
                    {/* Tags for mobile view matching table structure */}
                    <div className="flex flex-wrap gap-1 mt-1 md:hidden">
                      {file.ai_categories && file.ai_categories.slice(0, 2).map((cat, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-zinc-100 text-zinc-600 border border-zinc-200">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Type Column */}
                <div className="col-span-2 hidden md:flex items-center">
                  {file.ai_categories && file.ai_categories.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {file.ai_categories.slice(0, 1).map((cat, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-zinc-100 text-zinc-600 border border-zinc-200">
                          {cat}
                        </span>
                      ))}
                      {file.ai_categories.length > 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-zinc-100 text-zinc-500 border border-zinc-200">
                          +{file.ai_categories.length - 1}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400">-</span>
                  )}
                </div>

                {/* Size Column */}
                <div className="col-span-2 hidden md:block text-sm text-zinc-500 font-mono">
                  {formatSize(file.size)}
                </div>

                {/* Date Column */}
                <div className="col-span-3 md:col-span-3 lg:col-span-2 text-right text-sm text-zinc-500 font-mono flex items-center justify-end gap-2">
                  <span>{new Date(file.$createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={(e) => handleDelete(e, file)}
                    className="p-1.5 text-zinc-400 hover:text-red-700 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all font-bold"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Modal */}
      <NotificationModal
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ show: false, type: 'success', title: '', message: '' })}
      />
    </div>
  );
};

export default Vault;
