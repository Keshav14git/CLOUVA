
import React, { useState, useEffect } from 'react';
import { account } from './lib/appwrite';
import { OAuthProvider } from 'appwrite';

const DebugAuth = () => {
    const [logs, setLogs] = useState([]);
    const [user, setUser] = useState(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const addLog = (message, data = null) => {
        const timestamp = new Date().toLocaleTimeString();
        const entry = { timestamp, message, data: data ? JSON.stringify(data, null, 2) : '' };
        setLogs(prev => [entry, ...prev]);
        console.log(`[DebugAuth] ${message}`, data || '');
    };

    const checkSession = async () => {
        addLog('Checking session...');
        try {
            const result = await account.get();
            addLog('✅ Session ACTIVE', result);
            setUser(result);
        } catch (error) {
            addLog('❌ Session INACTIVE / Error', error);
            setUser(null);
        }
    };

    const loginEmail = async () => {
        addLog(`Attempting Email Login: ${email}`);
        try {
            await account.createEmailPasswordSession(email, password);
            addLog('✅ Login Success! (Session Created)');
            checkSession();
        } catch (error) {
            addLog('❌ Login Failed', error);
        }
    };

    const loginGoogle = () => {
        addLog('Initiating Google OAuth...');
        try {
            account.createOAuth2Session(
                OAuthProvider.Google,
                `${window.location.origin}/debug`, // Redirect back to debug page!
                `${window.location.origin}/debug?failure=true`
            );
        } catch (error) {
            addLog('❌ OAuth Initiation Failed', error);
        }
    };

    const logout = async () => {
        addLog('Logging out...');
        try {
            await account.deleteSession('current');
            addLog('✅ Logged out');
            setUser(null);
        } catch (error) {
            addLog('❌ Logout failed', error);
        }
    };

    useEffect(() => {
        checkSession();
    }, []);

    return (
        <div style={{ padding: 20, fontFamily: 'monospace', backgroundColor: '#f0f0f0', border: '2px solid red', margin: 20 }}>
            <h2 className="text-xl font-bold mb-4">🔐 Auth Debugger</h2>

            <div className="mb-4 text-sm">
                <p><strong>Endpoint:</strong> {import.meta.env.VITE_APPWRITE_ENDPOINT}</p>
                <p><strong>Project ID:</strong> {import.meta.env.VITE_APPWRITE_PROJECT_ID}</p>
            </div>

            <div className="flex gap-2 mb-4">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="border p-2 rounded"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="border p-2 rounded"
                />
                <button onClick={loginEmail} className="px-4 py-2 bg-green-500 text-white rounded">Login (Email)</button>
            </div>

            <div className="flex gap-2 mb-4">
                <button onClick={checkSession} className="px-4 py-2 bg-blue-500 text-white rounded">Check Session</button>
                <button onClick={loginGoogle} className="px-4 py-2 bg-red-500 text-white rounded">Login Google</button>
                <button onClick={logout} className="px-4 py-2 bg-gray-500 text-white rounded">Logout</button>
            </div>

            {user && (
                <div className="p-2 bg-green-100 border border-green-300 rounded mb-4">
                    <strong>Logged In as:</strong> {user.email} ({user.$id})
                </div>
            )}

            <div className="bg-black text-green-400 p-4 rounded h-64 overflow-y-auto text-xs">
                {logs.map((log, i) => (
                    <div key={i} className="mb-2 border-b border-gray-700 pb-1">
                        <span className="text-gray-500">[{log.timestamp}]</span> <span className="font-bold">{log.message}</span>
                        {log.data && <pre className="mt-1 ml-4 text-gray-300 whitespace-pre-wrap">{log.data}</pre>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DebugAuth;
