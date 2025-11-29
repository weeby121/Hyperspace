// src/Login.jsx
import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Box, ShieldCheck, Zap } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/'); // Go to Dashboard on success
    } catch (error) {
      console.error("Login Failed:", error);
      alert("Login failed. Check console for details.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
        
        {/* Header Section */}
        <div className="p-8 text-center bg-gradient-to-b from-slate-800 to-slate-900">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 mb-6">
            <Box className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">HyperSpace</h1>
          <p className="text-slate-400">Design systems in 3D, together.</p>
        </div>

        {/* Action Section */}
        <div className="p-8 pt-0">
          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 4.66c1.61 0 3.06.55 4.21 1.64l3.16-3.16C17.45 1.19 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center text-center p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <ShieldCheck className="w-6 h-6 text-green-500 mb-2" />
              <span className="text-xs text-slate-400">Secure Storage</span>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <Zap className="w-6 h-6 text-yellow-500 mb-2" />
              <span className="text-xs text-slate-400">Real-time Sync</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}