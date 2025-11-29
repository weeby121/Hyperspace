// src/components/board/BoardHeader.jsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Share2, Check, Copy } from 'lucide-react';

export default function BoardHeader({ onCopy }) {
  const navigate = useNavigate();
  const { boardId } = useParams();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    // Copy Board ID to clipboard
    navigator.clipboard.writeText(boardId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
      <button 
        onClick={() => navigate('/')} 
        className="pointer-events-auto bg-slate-800/90 hover:bg-slate-700 text-white p-3 rounded-xl border border-slate-700 shadow-lg mb-2 flex items-center gap-2"
      >
        <ArrowLeft size={20} />
        <span className="font-semibold text-sm hidden md:inline">Dashboard</span>
      </button>
      
      <div className="flex gap-2 pointer-events-auto">
        <div className="bg-slate-800/90 backdrop-blur border border-slate-700 text-slate-300 px-4 py-3 rounded-xl text-xs font-mono shadow-lg flex items-center gap-3">
             <span className="opacity-50">Board ID:</span>
             <span className="text-white font-bold select-all">{boardId}</span>
             <button onClick={handleShare} className="hover:text-white transition-colors">
                {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
             </button>
        </div>

        <button 
          onClick={handleShare} 
          className={`bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl shadow-lg transition-all flex items-center gap-2 ${copied ? 'bg-green-600 hover:bg-green-600' : ''}`}
        >
          {copied ? <Check size={20} /> : <Share2 size={20} />}
          <span className="font-semibold text-sm hidden md:inline">
              {copied ? "Copied ID!" : "Share"}
          </span>
        </button>
      </div>
    </div>
  );
}