import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth'; 
import { auth } from './firebase';

// Pages
import Login from './pages/LoginPage';
import Dashboard from './pages/DashBoard';
import Board from './pages/Workspace';
import About from './pages/About';
import Creator from './pages/Creator';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Connecting to HyperSpace...</p>
        </div>
      </div>
    );
  }

  // Wrapper for protected routes
  const ProtectedRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" />;
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <Login />} 
        />
        <Route path="/about" element={<About />} />
        <Route path="/creator" element={<Creator />} />

        {/* Dashboard (Root) */}
        <Route 
          path="/" 
          element={
            user ? (
              <Dashboard user={user} onLogout={handleLogout} />
            ) : (
              // If not logged in, show the Landing Page (Login Component acts as Landing)
              <Login />
            )
          } 
        />

        {/* Protected Board Route */}
        <Route 
          path="/board/:boardId" 
          element={
            <ProtectedRoute>
              <Board user={user} />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}