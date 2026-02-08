import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { databases, DATABASE_ID, COLLECTION_FILES, COLLECTION_FLASHCARDS } from '../lib/appwrite';
import { ID, Query, Permission, Role } from 'appwrite';
import { ArrowLeft, Download, FileText, Image as ImageIcon, File, ExternalLink, Sparkles, GraduationCap, ArrowRight, BrainCircuit } from 'lucide-react';
import { generateFlashcardsAI } from '../lib/groq';
import StudyModal from '../components/StudyModal';
import { useAuth } from '../context/AuthContext';

const FileDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [fileData, setFileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [flashcards, setFlashcards] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);

    useEffect(() => {
        const fetchFile = async () => {
            try {
                const doc = await databases.getDocument(DATABASE_ID, COLLECTION_FILES, id);
                setFileData(doc);
                fetchFlashcards(); // Initial fetch
            } catch (error) {
                console.error('Error fetching file:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchFlashcards = async () => {
            try {
                const response = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_FLASHCARDS,
                    [Query.equal('fileId', id)]
                );
                setFlashcards(response.documents);
            } catch (error) {
                console.log("No flashcards found or collection not created yet.");
            }
        };

        if (id) {
            fetchFile();
        }
    }, [id]);

    const handleGenerateFlashcards = async () => {
        if (!fileData?.extractedText) {
            alert("No text available to generate flashcards.");
            return;
        }

        setGenerating(true);
        try {
            // Get existing questions to prevent duplicates
            const existingQuestions = flashcards.map(card => card.question);
            const newCards = await generateFlashcardsAI(fileData.extractedText, existingQuestions);

            // Permissions
            const permissions = [
                Permission.read(Role.user(user.$id)),
                Permission.write(Role.user(user.$id)),
                Permission.update(Role.user(user.$id)),
                Permission.delete(Role.user(user.$id)),
            ];

            // Save to Appwrite
            const savedCards = [];
            for (const card of newCards) {
                const saved = await databases.createDocument(
                    DATABASE_ID,
                    COLLECTION_FLASHCARDS,
                    ID.unique(),
                    {
                        fileId: id,
                        question: card.question,
                        answer: card.answer
                    },
                    permissions
                );
                savedCards.push(saved);
            }

            setFlashcards([...flashcards, ...savedCards]);
        } catch (error) {
            console.error("Generation failed", error);
            alert("Failed to generate flashcards. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteFlashcard = async (cardId) => {
        if (window.confirm('Are you sure you want to delete this flashcard?')) {
            try {
                await databases.deleteDocument(DATABASE_ID, COLLECTION_FLASHCARDS, cardId);
                setFlashcards(flashcards.filter(card => card.$id !== cardId));
            } catch (error) {
                console.error('Error deleting flashcard:', error);
                alert('Failed to delete flashcard');
            }
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
    if (!fileData) return <div className="min-h-screen flex items-center justify-center text-white">File not found</div>;

    const isImage = fileData.type.includes('image');
    const isPDF = fileData.type.includes('pdf');

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 truncate max-w-md">{fileData.name}</h1>
                        <p className="text-sm text-zinc-500">
                            {new Date(fileData.$createdAt).toLocaleDateString()} • {(fileData.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href={fileData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="flex items-center gap-2 px-4 py-2 border border-zinc-200 text-zinc-700 bg-white rounded-lg font-medium hover:bg-zinc-50 transition-colors shadow-sm"
                    >
                        <Download size={18} />
                        Download
                    </a>
                </div>
            </div>

            {/* Split View */}
            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Content Viewer (70%) */}
                <div className="flex-[3] bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden relative group shadow-inner">
                    {isImage ? (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                            <img
                                src={fileData.url}
                                alt={fileData.name}
                                className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                            />
                        </div>
                    ) : isPDF ? (
                        <iframe
                            src={fileData.url}
                            className="w-full h-full border-none bg-white"
                            title="PDF Viewer"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
                            <div className="w-20 h-20 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                                <File size={40} className="text-zinc-400" />
                            </div>
                            <p>Preview not available for this file type.</p>
                            <a
                                href={fileData.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-rose-700 flex items-center gap-2 font-medium"
                            >
                                Open in new tab <ExternalLink size={16} />
                            </a>
                        </div>
                    )}
                </div>

                {/* Study Sidebar (30%) */}
                <div className="flex-1 min-w-[350px] bg-white border border-zinc-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 text-primary rounded-md">
                                <GraduationCap size={18} />
                            </div>
                            <h3 className="font-semibold text-zinc-900">Study Deck</h3>
                        </div>
                        <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">
                            {flashcards.length} Cards
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/30">
                        {flashcards.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-4">
                                <Sparkles size={32} className="text-zinc-300" />
                                <p className="text-sm">No flashcards yet. <br /> Generate them instantly using AI.</p>
                                <button
                                    onClick={handleGenerateFlashcards}
                                    disabled={generating}
                                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium shadow-sm hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all w-full flex items-center justify-center gap-2"
                                >
                                    {generating ? (
                                        <>Generating...</>
                                    ) : (
                                        <><Sparkles size={16} /> Generate Deck</>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-6 space-y-8 relative">
                                {/* Stacked Cards Visual */}
                                <div className="relative w-32 h-40 mb-4 group cursor-pointer" onClick={() => setIsStudyModalOpen(true)}>
                                    <div className="absolute inset-0 bg-white border border-zinc-200 rounded-xl shadow-sm transform translate-x-4 translate-y-4 rotate-6 opacity-40"></div>
                                    <div className="absolute inset-0 bg-white border border-zinc-200 rounded-xl shadow-sm transform translate-x-2 translate-y-2 rotate-3 opacity-70"></div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-white to-rose-50 border border-zinc-200 rounded-xl shadow-md flex items-center justify-center transform transition-transform group-hover:-translate-y-2 duration-300">
                                        <div className="p-3 bg-rose-100 text-primary rounded-xl">
                                            <BrainCircuit size={32} />
                                        </div>
                                    </div>
                                    {/* Badge */}
                                    <div className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm z-10">
                                        {flashcards.length}
                                    </div>
                                </div>

                                <div className="text-center space-y-2 z-10">
                                    <h4 className="text-xl font-bold text-zinc-900">Ready to Study?</h4>
                                    <p className="text-sm text-zinc-500 max-w-[200px] mx-auto leading-relaxed">
                                        Your deck is prepared with {flashcards.length} AI-generated cards.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setIsStudyModalOpen(true)}
                                    className="w-full py-3 bg-primary text-white rounded-xl font-medium shadow-sm hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                                >
                                    Start Studying <ArrowRight size={18} />
                                </button>

                                <button
                                    onClick={handleGenerateFlashcards}
                                    disabled={generating}
                                    className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center gap-2"
                                >
                                    {generating ? 'Adding more...' : 'Generate More Cards'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <StudyModal
                isOpen={isStudyModalOpen}
                onClose={() => setIsStudyModalOpen(false)}
                flashcards={flashcards}
                onGenerateMore={handleGenerateFlashcards}
                generating={generating}
                onDelete={handleDeleteFlashcard}
            />
        </div>
    );
};

export default FileDetail;
