import React from 'react';
import { Box, Type, PenTool, Move, Trash2, Database, Network } from 'lucide-react';
import { COLORS } from '../../constants/colors';

export default function BoardToolbar({ activeTool, setActiveTool, color, setColor, selectedId, onDelete, connectStartId }) {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto z-10">
      <div className="bg-slate-800/90 backdrop-blur p-2 rounded-2xl border border-slate-600 shadow-2xl flex items-center gap-2">
        <ToolBtn active={activeTool === 'move'} onClick={() => setActiveTool('move')} icon={<Move size={20} />} label="Move" />
        <div className="w-px h-8 bg-slate-600 mx-1" />
        <ToolBtn active={activeTool === 'cube'} onClick={() => setActiveTool('cube')} icon={<Box size={20} />} label="Cube" />
        <ToolBtn active={activeTool === 'database'} onClick={() => setActiveTool('database')} icon={<Database size={20} />} label="DB" />
        <ToolBtn active={activeTool === 'connect'} onClick={() => setActiveTool('connect')} icon={<Network size={20} />} label="Link" />
        <div className="w-px h-8 bg-slate-600 mx-1" />
        <ToolBtn active={activeTool === 'pen'} onClick={() => setActiveTool('pen')} icon={<PenTool size={20} />} label="Draw" />
        <ToolBtn active={activeTool === 'text'} onClick={() => setActiveTool('text')} icon={<Type size={20} />} label="Note" />
        <div className="w-px h-8 bg-slate-600 mx-1" />
        
        <div className="flex gap-1 px-2">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
          ))}
        </div>
        
        <div className="w-px h-8 bg-slate-600 mx-1" />
        <button onClick={onDelete} disabled={!selectedId} className={`p-3 rounded-xl ${selectedId ? 'text-red-400 hover:bg-red-900/30' : 'text-slate-600 cursor-not-allowed'}`}>
          <Trash2 size={20} />
        </button>
      </div>
      <div className="text-center mt-2 text-xs text-slate-400 font-medium shadow-black drop-shadow-md">
         {activeTool === 'connect' && connectStartId ? "Select Target Node" : "Left Click: Action | Right Click: Rotate"}
      </div>
    </div>
  );
}

function ToolBtn({ active, onClick, icon, label }) {
  return (
      <button onClick={onClick} className={`group relative p-3 rounded-xl transition-all ${active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
          {icon}
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-slate-700">{label}</span>
      </button>
  );
}