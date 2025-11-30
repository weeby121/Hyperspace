import { useState, useEffect, useRef } from 'react';
import { 
  collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const socket = io(SOCKET_URL);

export function useBoardData(boardId, user) {
  const [elements, setElements] = useState([]);
  const [cursors, setCursors] = useState([]); 

  const historyRef = useRef([]); 
  const futureRef = useRef([]);

  // ... (Sync Effects & Cursor Logic remain the same) ...
  useEffect(() => {
    if (!user || !boardId) return;
    const q = query(collection(db, 'boards', boardId, 'elements'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setElements(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [boardId, user]);

  useEffect(() => {
    if (!user || !boardId) return;
    socket.emit('join-board', boardId);
    const handleRemoteCursor = (data) => {
       setCursors(prev => {
           const filtered = prev.filter(c => c.userId !== data.userId);
           return [...filtered, data];
       });
    };
    socket.on('cursor-update', handleRemoteCursor);
    return () => { socket.off('cursor-update', handleRemoteCursor); };
  }, [boardId, user]);

  // --- Actions ---
  const addElement = async (data) => {
    const docRef = await addDoc(collection(db, 'boards', boardId, 'elements'), {
      ...data, createdAt: serverTimestamp(), createdBy: user.uid
    });
    historyRef.current.push({ type: 'create', id: docRef.id });
    futureRef.current = [];
  };

  // Unified Helper for Gizmo Updates (Position OR Rotation)
  const updateElementTransform = async (id, newData, oldData) => {
      // newData/oldData = { pos: {x,y,z}, rotation: {x,y,z} }
      await updateDoc(doc(db, 'boards', boardId, 'elements', id), newData);
      
      // Smart History: Determine what changed
      if (JSON.stringify(newData.pos) !== JSON.stringify(oldData.pos)) {
          historyRef.current.push({ type: 'move', id, from: oldData.pos, to: newData.pos });
      }
      if (JSON.stringify(newData.rotation) !== JSON.stringify(oldData.rotation)) {
          historyRef.current.push({ type: 'rotate', id, from: oldData.rotation, to: newData.rotation });
      }
      futureRef.current = [];
  };

  const deleteElement = async (id, oldData) => {
    await deleteDoc(doc(db, 'boards', boardId, 'elements', id));
    historyRef.current.push({ type: 'delete', id, data: oldData });
    futureRef.current = [];
  };

  // Cursor Broadcast (Same)
  const lastCursorUpdate = useRef(0);
  const updateMyCursor = (pos) => {
    const now = Date.now();
    if (now - lastCursorUpdate.current > 30) { 
       lastCursorUpdate.current = now;
       socket.emit('cursor-move', {
           boardId, x: pos.x, z: pos.z, userId: user.uid,
           color: user.photoURL || '#3B82F6'
       });
    }
  };

  // Undo/Redo (Same logic, relying on 'move' and 'rotate' types we push above)
  const undo = async () => {
      const action = historyRef.current.pop();
      if (!action) return;
      if (action.type === 'create') {
          await deleteDoc(doc(db, 'boards', boardId, 'elements', action.id));
          futureRef.current.push(action);
      } else if (action.type === 'delete') {
          await setDoc(doc(db, 'boards', boardId, 'elements', action.id), action.data);
          futureRef.current.push(action);
      } else if (action.type === 'move') {
          await updateDoc(doc(db, 'boards', boardId, 'elements', action.id), { pos: action.from });
          futureRef.current.push(action);
      } else if (action.type === 'rotate') {
          await updateDoc(doc(db, 'boards', boardId, 'elements', action.id), { rotation: action.from });
          futureRef.current.push(action);
      }
  };

  const redo = async () => {
      const action = futureRef.current.pop();
      if (!action) return;
      if (action.type === 'delete') {
          await deleteDoc(doc(db, 'boards', boardId, 'elements', action.id));
          historyRef.current.push(action);
      } else if (action.type === 'move') {
          await updateDoc(doc(db, 'boards', boardId, 'elements', action.id), { pos: action.to });
          historyRef.current.push(action);
      } else if (action.type === 'rotate') {
          await updateDoc(doc(db, 'boards', boardId, 'elements', action.id), { rotation: action.to });
          historyRef.current.push(action);
      }
  };

  // Expose the new unified updater
  return { elements, cursors, addElement, updateElementTransform, deleteElement, updateMyCursor, undo, redo };
}