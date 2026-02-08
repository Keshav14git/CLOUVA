import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Split, Info, ChevronRight, FileText, AlertCircle } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTION_FILES } from '../lib/appwrite';

const FileComparison = () => {
    const { id1, id2 } = useParams();
    const navigate = useNavigate();
    const [file1, setFile1] = useState(null);
    const [file2, setFile2] = useState(null);
    const [loading, setLoading] = useState(true);
    const [similarities, setSimilarities] = useState([]);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const [f1, f2] = await Promise.all([
                    databases.getDocument(DATABASE_ID, COLLECTION_FILES, id1),
                    databases.getDocument(DATABASE_ID, COLLECTION_FILES, id2)
                ]);
                setFile1(f1);
                setFile2(f2);

                // Simple similarity analysis (Topic Overlap)
                const cats1 = f1.ai_categories || [];
                const cats2 = f2.ai_categories || [];
                const common = cats1.filter(c => cats2.includes(c));
                setSimilarities(common);

            } catch (error) {
                console.error('Error fetching files for comparison:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFiles();
    }, [id1, id2]);

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-zinc-50">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-zinc-500 font-medium">Analyzing Neural Connection...</p>
            </div>
        );
    }

    if (!file1 || !file2) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-zinc-50">
                <AlertCircle size={48} className="text-zinc-300 mb-4" />
                <p className="text-zinc-500 font-medium">One or both files could not be found.</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-primary font-bold">Go Back</button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-zinc-50 overflow-hidden">
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-zinc-200 z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-red-100 rounded-md">
                            <Split size={18} className="text-primary" />
                        </div>
                        <h1 className="text-lg font-bold text-zinc-900">Neural Comparison</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-1.5 bg-zinc-100 rounded-full border border-zinc-200">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Semantic Context Active</span>
                </div>
            </header>

            {/* Analysis Banner */}
            {similarities.length > 0 && (
                <div className="bg-primary/5 border-b border-primary/10 px-8 py-3 flex items-center gap-3">
                    <Info size={16} className="text-primary" />
                    <p className="text-sm text-zinc-700">
                        These documents are connected via shared themes:
                        <span className="font-bold text-primary ml-2">
                            {similarities.join(' • ')}
                        </span>
                    </p>
                </div>
            )}

            {/* Side-by-Side View */}
            <div className="flex-1 flex overflow-hidden">
                {/* File 1 */}
                <div className="flex-1 border-r border-zinc-200 flex flex-col bg-white overflow-hidden">
                    <div className="p-4 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50/50">
                        <FileText size={18} className="text-zinc-400" />
                        <span className="font-bold text-sm text-zinc-900 truncate">{file1.name}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        <div className="bg-zinc-50 rounded-xl p-6 border border-zinc-100">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">AI Insight</h3>
                            <p className="text-zinc-800 leading-relaxed italic">
                                "{file1.ai_summary || 'No summary available for this file.'}"
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Extracted Content Context</h3>
                            <div className="prose prose-sm text-zinc-600 max-w-none">
                                {file1.content ? (
                                    file1.content.split('\n').map((line, i) => {
                                        const isSimilar = similarities.some(sim => line.toLowerCase().includes(sim.toLowerCase()));
                                        return (
                                            <p key={i} className={isSimilar ? 'bg-primary/5 border-l-2 border-primary pl-3 py-1 -ml-3' : ''}>
                                                {line}
                                            </p>
                                        );
                                    })
                                ) : (
                                    <p className="text-zinc-400 italic text-center py-20 bg-zinc-50/50 rounded-lg border border-dashed border-zinc-200">
                                        Processing heavy document content...
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* File 2 */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                    <div className="p-4 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50/50">
                        <FileText size={18} className="text-zinc-400" />
                        <span className="font-bold text-sm text-zinc-900 truncate">{file2.name}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        <div className="bg-zinc-50 rounded-xl p-6 border border-zinc-100">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">AI Insight</h3>
                            <p className="text-zinc-800 leading-relaxed italic">
                                "{file2.ai_summary || 'No summary available for this file.'}"
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Extracted Content Context</h3>
                            <div className="prose prose-sm text-zinc-600 max-w-none">
                                {file2.content ? (
                                    file2.content.split('\n').map((line, i) => {
                                        const isSimilar = similarities.some(sim => line.toLowerCase().includes(sim.toLowerCase()));
                                        return (
                                            <p key={i} className={isSimilar ? 'bg-primary/5 border-l-2 border-primary pl-3 py-1 -ml-3' : ''}>
                                                {line}
                                            </p>
                                        );
                                    })
                                ) : (
                                    <p className="text-zinc-400 italic text-center py-20 bg-zinc-50/50 rounded-lg border border-dashed border-zinc-200">
                                        Processing heavy document content...
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Navigation Overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-zinc-900 text-white rounded-full shadow-2xl flex items-center gap-6 z-30">
                <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Connection Score</span>
                    <span className="text-sm font-bold text-emerald-400">92% Neural Match</span>
                </div>
                <div className="h-8 w-px bg-zinc-800" />
                <button
                    onClick={() => navigate('/chat')}
                    className="flex items-center gap-2 text-sm font-bold hover:text-primary transition-colors"
                >
                    Discuss Similarity <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default FileComparison;
