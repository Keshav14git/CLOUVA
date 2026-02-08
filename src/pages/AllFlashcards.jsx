import React, { useState, useEffect } from 'react';
import { databases, DATABASE_ID, COLLECTION_FLASHCARDS, COLLECTION_FILES } from '../lib/appwrite';
import { Query } from 'appwrite';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Sparkles, FileText, BrainCircuit, Trash2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Flashcard from '../components/Flashcard';
import NotificationModal from '../components/NotificationModal';

const AllFlashcards = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [flashcards, setFlashcards] = useState([]);
    const [files, setFiles] = useState({});
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, type: 'success', title: '', message: '' });

    const handleDelete = async (cardId) => {
        if (window.confirm('Are you sure you want to delete this flashcard?')) {
            try {
                await databases.deleteDocument(DATABASE_ID, COLLECTION_FLASHCARDS, cardId);
                setFlashcards(flashcards.filter(card => card.$id !== cardId));
            } catch (error) {
                console.error('Error deleting flashcard:', error);
                setNotification({ show: true, type: 'error', title: 'Error', message: 'Failed to delete flashcard' });
            }
        }
    };

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // 1. Fetch all flashcards
                const cardsResponse = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_FLASHCARDS,
                    [Query.orderDesc('$createdAt')]
                );

                const cards = cardsResponse.documents;
                setFlashcards(cards);

                // 2. Extract unique file IDs
                const fileIds = [...new Set(cards.map(card => card.fileId))];

                // 3. Fetch file details for these IDs to get names
                // Appwrite doesn't have a "whereIn" query for IDs easily accessible in one go for client side sometimes without loop or complex query
                // We'll fetch all files for now if list is small, or fetch individually. 
                // Creating a map of fileId -> fileName

                const fileMap = {};
                // Optimization: Fetch files in parallel
                const filePromises = fileIds.map(fid =>
                    databases.getDocument(DATABASE_ID, COLLECTION_FILES, fid)
                        .then(doc => ({ id: fid, name: doc.name }))
                        .catch(() => ({ id: fid, name: 'Unknown File' }))
                );

                const fileResults = await Promise.all(filePromises);
                fileResults.forEach(f => {
                    fileMap[f.id] = f.name;
                });

                setFiles(fileMap);

            } catch (error) {
                console.error("Error loading study data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchAllData();
        }
    }, [user]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="container mx-auto max-w-7xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900">Your Study Vault</h1>
                    <p className="text-zinc-500">All your AI-generated flashcards in one place.</p>
                </div>
            </div>

            {flashcards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 bg-zinc-50 rounded-3xl flex items-center justify-center mb-6">
                        <BrainCircuit size={48} className="text-zinc-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-900 mb-2">No flashcards yet</h3>
                    <p className="text-zinc-500 max-w-md mb-8">
                        Upload documents to the Vault and generate flashcards to start building your study collection.
                    </p>
                    <Link
                        to="/vault"
                        className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-rose-700 transition-colors shadow-sm"
                    >
                        Go to Vault
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flashcards.map((card) => (
                        <div key={card.$id} className="flex flex-col gap-3">
                            {/* Card Metadata */}
                            <div className="flex items-center justify-between px-1">
                                <Link
                                    to={`/file/${card.fileId}`}
                                    className="text-xs font-medium text-zinc-500 hover:text-primary transition-colors flex items-center gap-1.5"
                                >
                                    <FileText size={12} />
                                    {files[card.fileId] || 'Loading...'}
                                </Link>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-zinc-400">
                                        {new Date(card.$createdAt).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(card.$id)}
                                        className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Delete Flashcard"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Flashcard Component */}
                            <Flashcard question={card.question} answer={card.answer} />
                        </div>
                    ))}
                </div>
            )}

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

export default AllFlashcards;
