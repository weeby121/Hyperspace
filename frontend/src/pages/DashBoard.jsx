import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, addDoc, query, where, onSnapshot, serverTimestamp, 
  deleteDoc, doc, updateDoc, arrayUnion, getDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Box, Plus, Trash2, Calendar, Layout, LogOut, Users, ArrowRight, Layers, Sparkles } from 'lucide-react';

export default function Dashboard({ user, onLogout }) {
  const [myBoards, setMyBoards] = useState([]);
  const [sharedBoards, setSharedBoards] = useState([]);
  const [activeTab, setActiveTab] = useState('private'); // 'private' | 'shared'
  const [joinCode, setJoinCode] = useState('');
  const [isJoinLoading, setIsJoinLoading] = useState(false);
  const navigate = useNavigate();

  // 1. Fetch "My Boards"
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'boards'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyBoards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Fetch "Shared Boards"
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'boards'), where('members', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSharedBoards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // --- Actions ---
  const createBoard = async () => {
    const title = prompt("Name your new universe:", "System Architecture v1");
    if (!title) return;
    try {
      const docRef = await addDoc(collection(db, 'boards'), {
        title: title,
        ownerId: user.uid,
        members: [],
        createdAt: serverTimestamp(),
      });
      navigate(`/board/${docRef.id}`);
    } catch (err) {
      console.error("Error creating board:", err);
    }
  };

  const handleJoinBoard = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setIsJoinLoading(true);
    try {
      const boardRef = doc(db, 'boards', joinCode.trim());
      const boardSnap = await getDoc(boardRef);
      if (boardSnap.exists()) {
        await updateDoc(boardRef, { members: arrayUnion(user.uid) });
        navigate(`/board/${joinCode.trim()}`);
      } else {
        alert("Universe not found! Check the ID.");
      }
    } catch (err) {
      console.error("Error joining:", err);
    } finally {
      setIsJoinLoading(false);
    }
  };

  const deleteBoard = async (e, boardId) => {
    e.stopPropagation();
    if (confirm("Destroy this universe? This cannot be undone.")) {
      await deleteDoc(doc(db, 'boards', boardId));
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden relative">
      
      {/* --- Ambient Background Effects --- */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      {/* --- Navbar --- */}
      <nav className="relative z-10 border-b border-white/5 bg-[#0b0f19]/50 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                <Box className="text-white" size={24} />
             </div>
             <div>
                <span className="block text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  HyperSpace
                </span>
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                  Workspace
                </span>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-slate-200">{user.displayName || "Explorer"}</span>
                <span className="text-xs text-slate-500 font-mono">{user.email}</span>
            </div>
            <div className="flex items-center gap-3">
                {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-slate-700/50" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold">
                        {user.email?.[0].toUpperCase()}
                    </div>
                )}
                <button 
                    onClick={onLogout} 
                    className="p-2.5 hover:bg-red-500/10 rounded-full transition text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/20"
                    title="Logout"
                >
                   <LogOut size={20} />
                </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto p-8">
        
        {/* --- Hero Section (Create & Join) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            
            {/* Create Card */}
            <button 
                onClick={createBoard}
                className="group relative h-56 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-[1px] overflow-hidden transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10 text-left"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-full w-full bg-[#0f1420]/90 backdrop-blur-xl rounded-[23px] p-8 flex flex-col justify-between border-t border-white/5">
                    <div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <Plus size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Create Universe</h2>
                        <p className="text-slate-400 text-sm">Start a new 3D collaborative environment from scratch.</p>
                    </div>
                    <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                        Launch System <ArrowRight size={16} />
                    </div>
                </div>
            </button>

            {/* Join Card */}
            <div className="lg:col-span-2 h-56 rounded-3xl bg-slate-800/40 border border-white/5 backdrop-blur-sm p-8 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Users size={120} />
                </div>
                <div className="relative z-10 max-w-lg">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <Sparkles className="text-yellow-500" size={20} /> 
                        Join a Session
                    </h2>
                    <p className="text-slate-400 text-sm mb-6">Enter a Board ID shared by your team to jump into their workspace instantly.</p>
                    
                    <form onSubmit={handleJoinBoard} className="flex gap-3">
                        <div className="flex-1 relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-50 transition duration-500 blur"></div>
                            <input 
                                type="text" 
                                placeholder="Paste Board ID (e.g. 7x8d9...)" 
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                className="relative w-full bg-[#0b0f19] border border-slate-700 text-white rounded-xl px-5 py-4 focus:outline-none focus:border-blue-500/50 placeholder-slate-600 font-mono text-sm transition-all"
                            />
                        </div>
                        <button 
                            disabled={isJoinLoading || !joinCode}
                            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-slate-500/10 whitespace-nowrap"
                        >
                            {isJoinLoading ? "Syncing..." : "Connect"}
                        </button>
                    </form>
                </div>
            </div>
        </div>

        {/* --- Content Tabs --- */}
        <div className="flex items-center gap-8 mb-8 border-b border-white/5 px-2">
            <button 
                onClick={() => setActiveTab('private')}
                className={`pb-4 px-2 text-sm font-bold tracking-wide transition-all relative ${
                    activeTab === 'private' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                MY UNIVERSES
                {activeTab === 'private' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                )}
            </button>
            <button 
                onClick={() => setActiveTab('shared')}
                className={`pb-4 px-2 text-sm font-bold tracking-wide transition-all relative ${
                    activeTab === 'shared' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                SHARED WITH ME
                {activeTab === 'shared' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                )}
            </button>
        </div>

        {/* --- Boards Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeTab === 'private' ? myBoards : sharedBoards).map(board => (
            <div 
              key={board.id}
              onClick={() => navigate(`/board/${board.id}`)}
              className="group relative bg-[#131825] hover:bg-[#1a2133] border border-white/5 hover:border-blue-500/30 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50"
            >
               <div className="flex justify-between items-start mb-6">
                 <div className={`p-3 rounded-xl ${activeTab === 'private' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                   {activeTab === 'private' ? <Layers size={20} /> : <Users size={20} />}
                 </div>
                 {activeTab === 'private' && (
                     <button 
                       onClick={(e) => deleteBoard(e, board.id)}
                       className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-all"
                       title="Delete"
                     >
                       <Trash2 size={16} />
                     </button>
                 )}
               </div>
               
               <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                 {board.title}
               </h3>
               
               <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
                 <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
                   <Calendar size={12} />
                   <span>
                     {board.createdAt?.seconds 
                       ? new Date(board.createdAt.seconds * 1000).toLocaleDateString() 
                       : 'Just now'}
                   </span>
                 </div>
                 <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400">
                    <ArrowRight size={16} />
                 </div>
               </div>
            </div>
          ))}

          {/* Empty State */}
          {(activeTab === 'private' ? myBoards : sharedBoards).length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                  <div className="p-4 bg-slate-800/50 rounded-full mb-4">
                    {activeTab === 'private' ? <Box size={32} className="opacity-50"/> : <Users size={32} className="opacity-50"/>}
                  </div>
                  <p className="text-lg font-medium text-slate-500">No universes found here.</p>
                  <p className="text-sm">
                      {activeTab === 'private' ? "Create a new one above to get started." : "Join a shared ID to see it here."}
                  </p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}