import React, { useState, useEffect } from 'react';
import { FileText, BrainCircuit, Zap, Clock, Plus, Search, ArrowUpRight, File } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { databases, DATABASE_ID, COLLECTION_FILES, COLLECTION_FLASHCARDS } from '../lib/appwrite';
import { Query } from 'appwrite';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [recentFiles, setRecentFiles] = useState([]);
    const [stats, setStats] = useState({
        totalFiles: 0,
        totalSize: 0,
        totalFlashcards: 0
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_FILES,
                    [
                        Query.orderDesc('$createdAt'),
                        Query.limit(5)
                    ]
                );

                setRecentFiles(response.documents);

                // Calculate stats (approximate for now based on recent fetch, 
                // for accurate total we'd need a separate aggregation query or fetch all)
                // For now, let's just use the total from the response meta if available, 
                // or just count what we have for the demo.
                // Fetch flashcards count
                const flashcardsResponse = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_FLASHCARDS,
                    [Query.limit(1)] // We only need the total count
                );

                setStats({
                    totalFiles: response.total,
                    totalSize: response.documents.reduce((acc, file) => acc + file.size, 0),
                    totalFlashcards: flashcardsResponse.total
                });

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchDashboardData();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-10"
        >
            {/* Hero Section */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 tracking-tight mb-2">
                        {getGreeting()}, <span className="text-primary">{user?.name?.split(' ')[0] || 'User'}</span>
                    </h1>
                    <p className="text-zinc-500 text-lg">Your second brain is ready. What shall we explore today?</p>
                </div>
                <div className="flex gap-3">
                    <button className="h-12 w-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-primary hover:border-primary transition-colors shadow-sm">
                        <Search size={20} />
                    </button>
                    <Link to="/vault" className="h-12 px-6 rounded-full bg-primary text-white font-medium flex items-center gap-2 hover:bg-rose-700 transition-colors shadow-sm hover:shadow-md">
                        <Plus size={20} />
                        <span>New Upload</span>
                    </Link>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={<FileText className="text-primary" />}
                    title="Total Knowledge"
                    value={`${stats.totalFiles} Files`}
                    trend="In your vault"
                    bg="bg-rose-50"
                    border="border-rose-100"
                />
                <StatCard
                    icon={<BrainCircuit className="text-violet-600" />}
                    title="Neural Nodes"
                    value="0 Connections"
                    trend="Growing network"
                    bg="bg-violet-50"
                    border="border-violet-100"
                />
                <Link to="/study" className="block">
                    <StatCard
                        icon={<Zap className="text-amber-600" />}
                        title="Total Flashcards"
                        value={`${stats.totalFlashcards} Cards`}
                        trend="Ready to learn"
                        bg="bg-amber-50"
                        border="border-amber-100"
                    />
                </Link>
            </motion.div>

            {/* Recent Activity / Files */}
            <motion.div variants={item} className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-zinc-900">Recent Activity</h3>
                    <Link to="/vault" className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center gap-1">
                        View all <ArrowUpRight size={14} />
                    </Link>
                </div>

                {recentFiles.length === 0 ? (
                    <div className="card min-h-[300px] flex flex-col items-center justify-center text-center p-12">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mb-4">
                            <Clock className="text-zinc-400 w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-medium text-zinc-900 mb-2">It's quiet here</h4>
                        <p className="text-zinc-500 max-w-sm">Upload your first document to the Vault to start building your knowledge graph.</p>
                        <Link to="/vault" className="mt-6 text-sm font-medium text-primary border-b border-primary/20 pb-0.5 hover:border-primary transition-colors">
                            Go to Vault
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {recentFiles.map((file) => (
                            <div
                                key={file.$id}
                                onClick={() => navigate(`/file/${file.$id}`)}
                                className="card p-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group border-transparent hover:border-border"
                            >
                                <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center flex-shrink-0">
                                    <File size={20} className="text-zinc-500 group-hover:text-primary transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-zinc-900 font-medium truncate group-hover:text-primary transition-colors">{file.name}</h4>
                                    <p className="text-sm text-zinc-500">
                                        {formatSize(file.size)} • {new Date(file.$createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-zinc-300 group-hover:text-primary transition-colors">
                                    <ArrowUpRight size={18} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

const StatCard = ({ icon, title, value, trend, bg, border }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className={`card relative overflow-hidden group p-6 border-transparent hover:border-zinc-200`}
    >
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-zinc-50 to-transparent rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110`} />

        <div className="relative z-10">
            <div className={`w-12 h-12 rounded-xl ${bg} ${border} border flex items-center justify-center mb-4`}>
                {icon}
            </div>
            <p className="text-sm text-zinc-500 font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-zinc-900 mb-2">{value}</h3>
            <p className="text-xs text-zinc-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {trend}
            </p>
        </div>
    </motion.div>
);

export default Dashboard;
