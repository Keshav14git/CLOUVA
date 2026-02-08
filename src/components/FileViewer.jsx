import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTION_FILES } from '../lib/appwrite';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const FileViewer = ({ fileId, fileUrl, fileType, initialPage = 1, documentId }) => {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(initialPage);
    const [loading, setLoading] = useState(true);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setLoading(false);
    }

    const changePage = (offset) => {
        setPageNumber(prevPageNumber => {
            const newPage = prevPageNumber + offset;
            if (newPage >= 1 && newPage <= numPages) {
                saveProgress(newPage);
                return newPage;
            }
            return prevPageNumber;
        });
    };

    const saveProgress = async (page) => {
        if (!documentId) return;
        try {
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTION_FILES,
                documentId,
                {
                    lastPage: page,
                    lastViewedAt: new Date().toISOString(),
                }
            );
            console.log('Progress saved:', page);
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    };

    if (fileType?.includes('image')) {
        return (
            <div className="image-viewer">
                <img src={fileUrl} alt="File content" style={{ maxWidth: '100%', maxHeight: '80vh' }} />
            </div>
        );
    }

    if (fileType?.includes('pdf')) {
        return (
            <div className="pdf-viewer-container">
                <div className="pdf-controls">
                    <button
                        disabled={pageNumber <= 1}
                        onClick={() => changePage(-1)}
                        className="nav-btn"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <span className="page-info">
                        Page {pageNumber} of {numPages || '--'}
                    </span>

                    <button
                        disabled={pageNumber >= numPages}
                        onClick={() => changePage(1)}
                        className="nav-btn"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                <div className="document-wrapper">
                    <Document
                        file={fileUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<div className="loading">Loading PDF...</div>}
                    >
                        <Page
                            pageNumber={pageNumber}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            width={800}
                        />
                    </Document>
                </div>

                <style>{`
          .pdf-viewer-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            background: var(--bg-card);
            padding: 2rem;
            border-radius: 1rem;
            min-height: 500px;
          }
          .pdf-controls {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
            background: rgba(15, 23, 42, 0.5);
            padding: 0.5rem 1rem;
            border-radius: 2rem;
          }
          .nav-btn {
            background: none;
            border: none;
            color: var(--text-primary);
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .nav-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }
          .nav-btn:not(:disabled):hover {
            background: rgba(255, 255, 255, 0.1);
          }
          .page-info {
            font-weight: 600;
            min-width: 100px;
            text-align: center;
          }
          .document-wrapper {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border-radius: 4px;
            overflow: hidden;
          }
          .loading {
            color: var(--text-secondary);
            padding: 2rem;
          }
        `}</style>
            </div>
        );
    }

    return (
        <div className="generic-viewer">
            <p>Preview not available for this file type.</p>
            <a href={fileUrl} download className="download-link">Download File</a>
        </div>
    );
};

export default FileViewer;
