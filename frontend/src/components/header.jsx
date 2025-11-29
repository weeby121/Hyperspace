import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Info, LogIn } from 'lucide-react';
import Logo from './logo'; // <--- Import the new Logo

export default function Header({ onLoginClick }) {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#020617]/50 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        {/* Logo Section */}
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
           {/* Logo Container with Glow Effect */}
           <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              <Logo className="w-9 h-9 text-cyan-400 relative z-10 drop-shadow-[0_0_10px_rgba(34,21,238,0.5)]" />
           </div>
           
           <div>
              <span className="block text-xl font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors">
                HyperSpace
              </span>
           </div>
        </div>
        
        {/* Navigation... (Rest of the file stays the same) */}
        <div className="flex items-center gap-1 md:gap-6">
          <button onClick={() => navigate('/about')} className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
            <Info size={16} /> <span>About Us</span>
          </button>
          <button onClick={() => navigate('/creator')} className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
            <User size={16} /> <span>The Architect</span>
          </button>
          {onLoginClick && (
            <button onClick={onLoginClick} className="ml-4 flex items-center gap-2 text-white/80 hover:text-white border border-white/10 hover:border-white/30 hover:bg-white/5 px-5 py-2 rounded-xl font-medium transition-all">
              <LogIn size={18} /> <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}