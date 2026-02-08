import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, ArrowRight, Shield, ArrowLeft, Mail, CheckCircle2, AlertCircle, FileText, Globe, MessageSquare, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
    // Mode: 'login' | 'signup' | 'forgot'
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup, loginWithGoogle, sendPasswordReset } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (searchParams.get('failure') === 'true') {
            setError('Google sign in failed. Please try again.');
        }
    }, [searchParams]);

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        const result = await sendPasswordReset(email);
        if (result.success) {
            setSuccessMsg('Reset link sent to your email.');
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        let result;
        if (mode === 'login') {
            result = await login(email, password);
        } else if (mode === 'signup') {
            result = await signup(email, password, name);
        }

        if (result && result.success) {
            navigate('/dashboard');
        } else if (result) {
            setError(result.error);
        }
        setLoading(false);
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setError('');
        setSuccessMsg('');
    };

    return (
        <div className="min-h-screen bg-white flex overflow-hidden font-sans">
            {/* Left Panel: Access Terminal */}
            <div className="w-full lg:w-[480px] xl:w-[520px] bg-white flex flex-col justify-between p-8 lg:p-12 z-20 shadow-[20px_0_40px_-10px_rgba(0,0,0,0.05)] relative border-r border-zinc-100">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <img src="/C.png" alt="Clouva" className="h-10 w-auto object-contain" />
                </div>

                {/* Main Form Area */}
                <div className="max-w-[340px] w-full mx-auto relative">
                    <AnimatePresence mode="wait">
                        {mode === 'forgot' ? (
                            <motion.div
                                key="forgot"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className="mb-8">
                                    <button
                                        onClick={() => switchMode('login')}
                                        className="inline-flex items-center text-zinc-400 hover:text-zinc-900 text-xs font-bold uppercase tracking-widest mb-6 transition-colors group"
                                    >
                                        <ArrowLeft size={12} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                                        Back to Login
                                    </button>
                                    <h1 className="text-3xl font-bold text-zinc-900 tracking-tight leading-tight mb-3">
                                        Reset Access
                                    </h1>
                                    <p className="text-zinc-500 text-sm leading-relaxed">
                                        Enter your email address to receive a secure password reset link.
                                    </p>
                                </div>

                                <form onSubmit={handlePasswordReset} className="space-y-6">
                                    <AnimatePresence mode="wait">
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="p-3 bg-red-50 border-l-2 border-red-600 rounded-r-md text-red-700 text-xs font-medium flex items-center gap-2"
                                            >
                                                <AlertCircle size={14} className="shrink-0" />
                                                {error}
                                            </motion.div>
                                        )}
                                        {successMsg && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="p-3 bg-green-50 border-l-2 border-green-600 rounded-r-md text-green-700 text-xs font-medium flex items-center gap-2"
                                            >
                                                <CheckCircle2 size={14} className="shrink-0" />
                                                {successMsg}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-zinc-50 border-b-2 border-zinc-200 focus:border-red-600 px-3 py-2 text-sm font-medium text-zinc-900 focus:outline-none transition-colors placeholder-zinc-400"
                                            placeholder="name@company.com"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || successMsg}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group mt-4 shadow-lg shadow-red-600/20"
                                    >
                                        {loading ? (
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Send Reset Link
                                                <Mail size={16} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="auth"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className="mb-10">
                                    <h1 className="text-3xl font-bold text-zinc-900 tracking-tight leading-tight mb-3">
                                        {mode === 'login' ? 'Authenticate' : 'Initialize Access'}
                                    </h1>
                                    <p className="text-zinc-500 text-sm leading-relaxed">
                                        {mode === 'login'
                                            ? 'Enter your credentials to access the secure knowledge vault.'
                                            : 'Create your secure identity to begin indexing your digital life.'}
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <AnimatePresence mode="wait">
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="p-3 bg-red-50 border-l-2 border-red-600 rounded-r-md text-red-700 text-xs font-medium flex items-center gap-2"
                                            >
                                                <Shield size={14} className="shrink-0" />
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                        {mode === 'signup' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                            >
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Full Identity</label>
                                                    <input
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="w-full bg-zinc-50 border-b-2 border-zinc-200 focus:border-red-600 px-3 py-2 text-sm font-medium text-zinc-900 focus:outline-none transition-colors placeholder-zinc-400"
                                                        placeholder="John Doe"
                                                        required={mode === 'signup'}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-zinc-50 border-b-2 border-zinc-200 focus:border-red-600 px-3 py-2 text-sm font-medium text-zinc-900 focus:outline-none transition-colors placeholder-zinc-400"
                                            placeholder="name@company.com"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Password</label>
                                            {mode === 'login' && (
                                                <button
                                                    type="button"
                                                    onClick={() => switchMode('forgot')}
                                                    className="text-[10px] font-bold text-red-600 hover:text-red-700 uppercase tracking-widest transition-colors"
                                                >
                                                    Forgot Password?
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-zinc-50 border-b-2 border-zinc-200 focus:border-red-600 px-3 py-2 text-sm font-medium text-zinc-900 focus:outline-none transition-colors placeholder-zinc-400"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group mt-4 shadow-lg shadow-red-600/20"
                                    >
                                        {loading ? (
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                {mode === 'login' ? 'Grant Access' : 'Create System ID'}
                                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-white/90 group-hover:text-white" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="mt-8 flex flex-col gap-4">
                                    <button
                                        onClick={loginWithGoogle}
                                        className="w-full bg-white border border-zinc-200 text-red-600 font-medium py-2.5 rounded-lg hover:bg-red-50 hover:border-red-100 transition-all flex items-center justify-center gap-3 text-sm group"
                                    >
                                        <svg className="w-4 h-4 fill-current text-red-600 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Continue with Google
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center text-xs text-zinc-400 font-medium z-20">
                    {mode !== 'forgot' && (
                        <button
                            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                            className="hover:text-red-600 transition-colors uppercase tracking-wider"
                        >
                            {mode === 'login' ? 'Create Account' : 'Back to Login'}
                        </button>
                    )}
                    <Link to="/" className="hover:text-zinc-900 transition-colors uppercase tracking-wider ml-auto">Help & Support</Link>
                </div>
            </div>

            {/* Right Panel: The Knowledge Graph */}
            <div className="hidden lg:flex flex-1 bg-zinc-50 relative items-center justify-center overflow-hidden">
                {/* Background Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.3]"
                    style={{
                        backgroundImage: `radial-gradient(#e4e4e7 1px, transparent 1px)`,
                        backgroundSize: '32px 32px'
                    }}
                />

                {/* Animated Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <motion.line
                        x1="200"
                        y1="200"
                        x2="50%"
                        y2="50%"
                        stroke="#e4e4e7"
                        strokeWidth="2"
                        strokeDasharray="10 10"
                        initial={{ strokeDashoffset: 100 }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.line
                        x1="80%"
                        y1="20%"
                        x2="50%"
                        y2="50%"
                        stroke="#e4e4e7"
                        strokeWidth="2"
                        strokeDasharray="10 10"
                        initial={{ strokeDashoffset: 100 }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.line
                        x1="80%"
                        y1="80%"
                        x2="50%"
                        y2="50%"
                        stroke="#e4e4e7"
                        strokeWidth="2"
                        strokeDasharray="10 10"
                        initial={{ strokeDashoffset: 100 }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    />
                </svg>

                {/* Central Hub */}
                <div className="relative z-10">
                    {/* Pulse Effect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: [0.95, 1.05, 0.95] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-32 h-32 bg-white rounded-full shadow-xl shadow-red-500/10 flex items-center justify-center relative z-20 border-4 border-white"
                    >
                        <div className="absolute inset-0 rounded-full border border-red-100" />
                        <img src="/C.png" alt="Clouva Core" className="w-16 h-16 object-contain" />
                    </motion.div>
                </div>

                {/* Floating Input Nodes */}
                <motion.div
                    initial={{ x: -100, y: -50, opacity: 0 }}
                    animate={{ x: 0, y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 1 }}
                    className="absolute top-1/3 left-1/4 p-4 bg-white rounded-2xl shadow-lg border border-zinc-100 flex items-center gap-3 z-10"
                >
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <FileText size={20} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-zinc-900">Q3 Report.pdf</div>
                        <div className="text-[10px] text-zinc-500">Indexing...</div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ x: 100, y: -80, opacity: 0 }}
                    animate={{ x: 0, y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="absolute top-1/4 right-1/4 p-4 bg-white rounded-2xl shadow-lg border border-zinc-100 flex items-center gap-3 z-10"
                >
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                        <Globe size={20} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-zinc-900">Research Wiki</div>
                        <div className="text-[10px] text-zinc-500">Connected</div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ x: 50, y: 100, opacity: 0 }}
                    animate={{ x: 0, y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="absolute bottom-1/3 right-1/3 p-4 bg-white rounded-2xl shadow-lg border border-zinc-100 flex items-center gap-3 z-10"
                >
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-zinc-900">Team Chat</div>
                        <div className="text-[10px] text-zinc-500">Syncing...</div>
                    </div>
                </motion.div>

                <div className="absolute bottom-12 text-center z-10">
                    <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Unified Knowledge Base</h2>
                    <p className="text-zinc-500 text-sm mt-2 max-w-xs leading-relaxed mx-auto">
                        Connect your apps and let AI organize your world.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
