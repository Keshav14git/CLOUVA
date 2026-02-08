import React, { createContext, useContext, useState, useEffect } from 'react';
import { account } from '../lib/appwrite';
import { ID, OAuthProvider } from 'appwrite';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUserStatus();
    }, []);

    const checkUserStatus = async () => {
        try {
            const accountDetails = await account.get();
            console.log('User authenticated:', accountDetails);
            setUser(accountDetails);
        } catch (error) {
            // 401 is expected if the user is not logged in (guest)
            if (error.code !== 401) {
                console.error('Authentication check failed:', error);
            }
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            await account.createEmailPasswordSession(email, password);
            const accountDetails = await account.get();
            setUser(accountDetails);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const signup = async (email, password, name) => {
        try {
            await account.create(ID.unique(), email, password, name);
            await login(email, password);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            await account.deleteSession('current');
            setUser(null);
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const loginWithGoogle = () => {
        account.createOAuth2Session(
            OAuthProvider.Google,
            `${window.location.origin}/dashboard`, // Success URL
            `${window.location.origin}/login?failure=true` // Failure URL
        );
    };

    const updateUser = async (name) => {
        try {
            await account.updateName(name);
            const accountDetails = await account.get();
            setUser(accountDetails);
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    };

    const sendPasswordReset = async (email) => {
        try {
            // Redirect to a reset page (we'll implement this route next)
            await account.createRecovery(email, `${window.location.origin}/reset-password`);
            return { success: true };
        } catch (error) {
            console.error('Password reset failed:', error);
            return { success: false, error: error.message };
        }
    };

    const value = {
        user,
        login,
        signup,
        logout,
        loginWithGoogle,
        sendPasswordReset,
        loading,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
