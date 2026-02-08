import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { User, Bell, Shield, LogOut, Save, Loader, Monitor } from 'lucide-react';

const Settings = () => {
    const { user, logout, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Preferences State
    const [preferences, setPreferences] = useState({
        notifications: true,
        compactMode: false
    });

    useEffect(() => {
        // Load preferences from localStorage
        const savedPrefs = localStorage.getItem('userPreferences');
        if (savedPrefs) {
            setPreferences(JSON.parse(savedPrefs));
        }
    }, []);

    const togglePreference = (key) => {
        setPreferences(prev => {
            const newPrefs = { ...prev, [key]: !prev[key] };
            localStorage.setItem('userPreferences', JSON.stringify(newPrefs));
            return newPrefs;
        });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await updateUser(name);
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
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
            className="max-w-4xl mx-auto space-y-8"
        >
            <motion.div variants={item}>
                <h1 className="text-3xl font-bold text-zinc-900 mb-2">Settings</h1>
                <p className="text-zinc-500">Manage your account and preferences.</p>
            </motion.div>

            {/* Profile Section */}
            <motion.div variants={item} className="card space-y-6 p-6">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                    <User className="text-primary" size={24} />
                    <h2 className="text-xl font-semibold text-zinc-900">Profile</h2>
                </div>

                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-2xl font-bold text-zinc-900">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <p className="text-sm text-zinc-500 mb-1">Profile Picture</p>
                        <button className="text-sm text-primary hover:text-rose-700 transition-colors font-medium">
                            Change Avatar
                        </button>
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-zinc-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-zinc-500 cursor-not-allowed shadow-inner"
                        />
                    </div>

                    {message.text && (
                        <p className={`text-sm ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {message.text}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || name === user?.name}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Changes
                    </button>
                </form>
            </motion.div>

            {/* Preferences Section */}
            <motion.div variants={item} className="card space-y-6 p-6">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                    <Bell className="text-violet-600" size={24} />
                    <h2 className="text-xl font-semibold text-zinc-900">Preferences</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                        <div>
                            <h3 className="text-zinc-900 font-medium">Email Notifications</h3>
                            <p className="text-sm text-zinc-500">Receive updates about your activity.</p>
                        </div>
                        <button
                            onClick={() => togglePreference('notifications')}
                            className={`w-11 h-6 rounded-full relative transition-colors ${preferences.notifications ? 'bg-primary' : 'bg-zinc-300'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${preferences.notifications ? 'left-[22px]' : 'left-0.5'} shadow-sm`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                        <div>
                            <h3 className="text-zinc-900 font-medium">Compact Mode</h3>
                            <p className="text-sm text-zinc-500">Reduce padding and font sizes.</p>
                        </div>
                        <button
                            onClick={() => togglePreference('compactMode')}
                            className={`w-11 h-6 rounded-full relative transition-colors ${preferences.compactMode ? 'bg-primary' : 'bg-zinc-300'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${preferences.compactMode ? 'left-[22px]' : 'left-0.5'} shadow-sm`} />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Danger Zone */}
            <motion.div variants={item} className="card border-red-200 bg-red-50 space-y-6 p-6">
                <div className="flex items-center gap-3 border-b border-red-200 pb-4">
                    <Shield className="text-red-600" size={24} />
                    <h2 className="text-xl font-semibold text-red-900">Danger Zone</h2>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-red-900 font-medium">Sign Out</h3>
                        <p className="text-sm text-red-700">Securely log out of your account.</p>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 border border-red-200 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Settings;
