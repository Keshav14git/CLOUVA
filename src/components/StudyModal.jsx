import React from 'react';
import { X, Sparkles, BrainCircuit, Trash2 } from 'lucide-react';
import Flashcard from './Flashcard';
import { motion, AnimatePresence } from 'framer-motion';

const StudyModal = ({ isOpen, onClose, flashcards, onGenerateMore, generating, onDelete }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-zinc-50 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10"
                >
                    {/* Header */}
                    <div className="bg-white border-b border-zinc-200 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-100 text-primary rounded-lg">
                                <BrainCircuit size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-zinc-900">Study Mode</h2>
                                <p className="text-sm text-zinc-500">{flashcards.length} Cards Available</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500 hover:text-zinc-900 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 bg-zinc-50/50">
                        {flashcards.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                                <Sparkles size={48} className="text-zinc-300 mb-4" />
                                <p className="text-lg font-medium">No cards generated yet.</p>
                                <p className="text-sm">Click "Generate" to start studying.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                                {flashcards.map((card, index) => (
                                    <div key={card.$id || index} className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center px-1">
                                            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Card {index + 1}</div>
                                            <button
                                                onClick={() => onDelete(card.$id)}
                                                className="text-zinc-300 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
                                                title="Delete Card"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <Flashcard question={card.question} answer={card.answer} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-white border-t border-zinc-200 p-4 flex justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-zinc-600 font-medium hover:bg-zinc-100 rounded-xl transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={onGenerateMore}
                            disabled={generating}
                            className="px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-rose-700 active:scale-95 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generating ? (
                                <>
                                    <Sparkles size={18} className="animate-spin" /> Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} /> Generate More Cards
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StudyModal;
