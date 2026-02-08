import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Vault from './pages/Vault';
import FileDetail from './pages/FileDetail';
import NeuroGraph from './components/NeuroGraph';
import ChatBot from './components/ChatBot';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Settings from './pages/Settings';
import AllFlashcards from './pages/AllFlashcards';
import FileComparison from './pages/FileComparison';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-white">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
            <Route path="/file/:id" element={<ProtectedRoute><FileDetail /></ProtectedRoute>} />
            <Route path="/neuro-graph" element={<ProtectedRoute><NeuroGraph /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatBot /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/study" element={<ProtectedRoute><AllFlashcards /></ProtectedRoute>} />
            <Route path="/compare/:id1/:id2" element={<ProtectedRoute><FileComparison /></ProtectedRoute>} />
          </Routes>
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
