// src/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, addDoc, query, where, onSnapshot, serverTimestamp, 
  deleteDoc, doc, updateDoc, arrayUnion, getDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Box, Plus, Trash2, Calendar, Layout, LogOut, Users, ArrowRight } from 'lucide-react';

export default function Dashboard({ user, onLogout }) {
  const [myBoards, setMyBoards] = useState([]);
  const [sharedBoards, setSharedBoards] = useState([]);
  const [activeTab, setActiveTab] = useState('private'); // 'private' | 'shared'
  const [joinCode, setJoinCode] = useState('');
  const [isJoinLoading, setIsJoinLoading] = useState(false);
  const navigate = useNavigate();

  // 1. Fetch "My Boards" (Owner)
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'boards'), 
      where('ownerId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyBoards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Fetch "Shared Boards" (Member)
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'boards'), 
      where('members', 'array-contains', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSharedBoards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // --- Actions ---

  const createBoard = async () => {
    const title = prompt("Name your new board:", "Project Alpha");
    if (!title) return;

    try {
      const docRef = await addDoc(collection(db, 'boards'), {
        title: title,
        ownerId: user.uid,
        members: [], // Init empty members array
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
        // Add myself to the members list so it shows up in "Shared"
        await updateDoc(boardRef, {
          members: arrayUnion(user.uid)
        });
        navigate(`/board/${joinCode.trim()}`);
      } else {
        alert("Board not found! Check the code.");
      }
    } catch (err) {
      console.error("Error joining:", err);
      alert("Could not join board.");
    } finally {
      setIsJoinLoading(false);
    }
  };

  const deleteBoard = async (e, boardId) => {
    e.stopPropagation();
    if (confirm("Are you sure? This cannot be undone.")) {
      await deleteDoc(doc(db, 'boards', boardId));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-lg">
                <Box className="text-white" size={20} />
             </div>
             <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
               SpatialSync
             </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-white">{user.displayName || "User"}</span>
                <span className="text-xs text-slate-500">{user.email}</span>
            </div>
            {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-slate-700" />
            ) : (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">{user.email?.[0].toUpperCase()}</div>
            )}
            <button onClick={onLogout} className="ml-4 p-2 hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-white">
               <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-8">
        
        {/* Join Section */}
        <div className="mb-12 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
                <h2 className="text-xl font-bold text-white mb-1">Join a Session</h2>
                <p className="text-slate-400 text-sm">Paste a Board ID shared by your teammate.</p>
            </div>
            <form onSubmit={handleJoinBoard} className="flex w-full md:w-auto gap-2">
                <input 
                    type="text" 
                    placeholder="Paste Board ID here..." 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-600 transition-all"
                />
                <button 
                    disabled={isJoinLoading || !joinCode}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                    {isJoinLoading ? "Joining..." : <>Join <ArrowRight size={18}/></>}
                </button>
            </form>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-8 border-b border-slate-800">
            <button 
                onClick={() => setActiveTab('private')}
                className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'private' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                My Boards
                {activeTab === 'private' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />}
            </button>
            <button 
                onClick={() => setActiveTab('shared')}
                className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'shared' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Shared with Me
                {activeTab === 'shared' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-t-full" />}
            </button>
        </div>

        {/* Board Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* "Create New" Card - Only show on Private Tab */}
          {activeTab === 'private' && (
            <button 
                onClick={createBoard}
                className="group flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-700 rounded-2xl hover:border-blue-500 hover:bg-slate-800/30 transition-all"
            >
                <div className="bg-slate-800 p-4 rounded-full group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300 mb-4 shadow-lg">
                <Plus size={32} className="text-slate-400 group-hover:text-white" />
                </div>
                <span className="text-slate-400 font-semibold group-hover:text-blue-400">Create New Board</span>
            </button>
          )}

          {/* Board List */}
          {(activeTab === 'private' ? myBoards : sharedBoards).map(board => (
            <div 
              key={board.id}
              onClick={() => navigate(`/board/${board.id}`)}
              className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer transition-all group relative flex flex-col justify-between h-48"
            >
               <div>
                   <div className="flex justify-between items-start mb-4">
                     <div className={`p-3 rounded-xl ${activeTab === 'private' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                       {activeTab === 'private' ? <Layout size={24} /> : <Users size={24} />}
                     </div>
                     {/* Only Owner can delete */}
                     {activeTab === 'private' && (
                         <button 
                           onClick={(e) => deleteBoard(e, board.id)}
                           className="p-2 hover:bg-red-500/20 rounded-lg text-slate-600 hover:text-red-400 transition"
                         >
                           <Trash2 size={18} />
                         </button>
                     )}
                   </div>
                   <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                     {board.title}
                   </h3>
               </div>
               
               <div className="flex items-center gap-2 text-slate-500 text-xs border-t border-slate-700/50 pt-4">
                 <Calendar size={12} />
                 <span>
                   {board.createdAt?.seconds 
                     ? new Date(board.createdAt.seconds * 1000).toLocaleDateString() 
                     : 'Just now'}
                 </span>
               </div>
            </div>
          ))}

          {(activeTab === 'private' ? myBoards : sharedBoards).length === 0 && activeTab === 'shared' && (
              <div className="col-span-full text-center py-12 text-slate-500">
                  <Users size={48} className="mx-auto mb-4 opacity-20" />
                  <p>You haven't joined any boards yet.</p>
                  <p className="text-sm">Use the form above to join a teammate's board.</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}