// src/hooks/useBoardData.js
import { useState, useEffect, useRef } from 'react';
import { 
  collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { io } from "socket.io-client"; // Import Socket Client

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// Connect to your local microservice
const socket = io(SOCKET_URL);

export function useBoardData(boardId, user) {
  const [elements, setElements] = useState([]);
  const [cursors, setCursors] = useState([]); 

  // Refs for history (Undo/Redo)
  const historyRef = useRef([]); 
  const futureRef = useRef([]);

  // 1. Sync Elements (KEEP FIREBASE for persistence) [cite: 20]
  useEffect(() => {
    if (!user || !boardId) return;
    const q = query(collection(db, 'boards', boardId, 'elements'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setElements(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [boardId, user]);

  // 2. Sync Cursors (SWITCH TO MICROSERVICE) 
  useEffect(() => {
    if (!user || !boardId) return;

    // Join the "Room"
    socket.emit('join-board', boardId);

    // Listen for updates from other users
    const handleRemoteCursor = (data) => {
       // Update state with new cursor data
       setCursors(prev => {
           // Remove old cursor for this specific user and add new one
           const filtered = prev.filter(c => c.userId !== data.userId);
           return [...filtered, data];
       });
    };

    socket.on('cursor-update', handleRemoteCursor);

    // Cleanup listeners when board changes
    return () => {
        socket.off('cursor-update', handleRemoteCursor);
    };
  }, [boardId, user]);

  // --- Actions --- (Keep existing element logic)
  const addElement = async (data) => {
    const docRef = await addDoc(collection(db, 'boards', boardId, 'elements'), {
      ...data, createdAt: serverTimestamp(), createdBy: user.uid
    });
    historyRef.current.push({ type: 'create', id: docRef.id });
    futureRef.current = [];
  };

  const updateElementPosition = async (id, newPos, oldPos) => {
    await updateDoc(doc(db, 'boards', boardId, 'elements', id), { pos: newPos });
    historyRef.current.push({ type: 'move', id, from: oldPos, to: newPos });
    futureRef.current = [];
  };

  const deleteElement = async (id, oldData) => {
    await deleteDoc(doc(db, 'boards', boardId, 'elements', id));
    historyRef.current.push({ type: 'delete', id, data: oldData });
    futureRef.current = [];
  };

  // --- Broadcast My Cursor (SWITCH TO MICROSERVICE) ---
  const lastCursorUpdate = useRef(0);
  
  const updateMyCursor = (pos) => {
    const now = Date.now();
    // Throttle to 30ms (Smooth performance) [cite: 10]
    if (now - lastCursorUpdate.current > 30) { 
       lastCursorUpdate.current = now;
       // Fire and forget - send directly to Node server
       socket.emit('cursor-move', {
           boardId,
           x: pos.x,
           z: pos.z,
           userId: user.uid,
           color: user.photoURL || '#3B82F6' // Use profile pic if available
       });
    }
  };

  // --- Undo Logic ---
  const undo = async () => {
      const action = historyRef.current.pop();
      if (!action) return;

      if (action.type === 'create') {
          // Inverse of Create is Delete
          await deleteDoc(doc(db, 'boards', boardId, 'elements', action.id));
          futureRef.current.push(action);
      } 
      else if (action.type === 'delete') {
          // Inverse of Delete is Create (Restore data)
          await setDoc(doc(db, 'boards', boardId, 'elements', action.id), action.data);
          futureRef.current.push(action);
      }
      else if (action.type === 'move') {
          // Inverse of Move is Move Back
          await updateDoc(doc(db, 'boards', boardId, 'elements', action.id), { pos: action.from });
          futureRef.current.push(action);
      }
  };

  // --- Redo Logic ---
  const redo = async () => {
      const action = futureRef.current.pop();
      if (!action) return;

      if (action.type === 'create') {
          console.warn("Redo Create not fully implemented in MVP");
      }
      else if (action.type === 'delete') {
          await deleteDoc(doc(db, 'boards', boardId, 'elements', action.id));
          historyRef.current.push(action);
      }
      else if (action.type === 'move') {
          await updateDoc(doc(db, 'boards', boardId, 'elements', action.id), { pos: action.to });
          historyRef.current.push(action);
      }
  };

  return { elements, cursors, addElement, updateElementPosition, deleteElement, updateMyCursor, undo, redo };
}