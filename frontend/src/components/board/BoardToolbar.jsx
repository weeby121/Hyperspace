import React, { useState } from 'react';
import { 
  Box, Type, PenTool, Move, Trash2, Database, Network, Eraser, Heading, 
  RotateCw, Palette, Shapes, X, Circle, Triangle, Disc, Cylinder 
} from 'lucide-react';
import { COLORS } from '../../constants/colors';

export default function BoardToolbar({ activeTool, setActiveTool, color, setColor, selectedId, onDelete }) {
  const [openMenu, setOpenMenu] = useState(null); // 'shapes' | 'colors' | null

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const selectShape = (tool) => {
    setActiveTool(tool);
    setOpenMenu(null);
  };

  const selectColor = (c) => {
    setColor(c);
    setOpenMenu(null);
  };

  return (
    <div className="bg-[#0f172a] border border-slate-700/50 rounded-2xl p-3 shadow-xl flex flex-col gap-3 relative">
      
      {/* --- POPUP MENUS --- */}
      
      {/* Shapes Menu (Expanded) */}
      {openMenu === 'shapes' && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-[#1e293b] border border-slate-600/50 p-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-200 z-50">
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Primitive Shapes</div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <ToolBtn active={activeTool === 'cube'} onClick={() => selectShape('cube')} icon={<Box size={20} />} title="Cube" />
            <ToolBtn active={activeTool === 'sphere'} onClick={() => selectShape('sphere')} icon={<Circle size={20} />} title="Sphere" />
            <ToolBtn active={activeTool === 'cylinder'} onClick={() => selectShape('cylinder')} icon={<Cylinder size={20} />} title="Cylinder" />
            <ToolBtn active={activeTool === 'cone'} onClick={() => selectShape('cone')} icon={<Triangle size={20} />} title="Cone" />
            <ToolBtn active={activeTool === 'torus'} onClick={() => selectShape('torus')} icon={<Disc size={20} />} title="Torus" />
          </div>
          
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">System Elements</div>
          <div className="grid grid-cols-2 gap-2">
            <ToolBtn active={activeTool === 'database'} onClick={() => selectShape('database')} icon={<Database size={20} />} title="Database Node" />
            <ToolBtn active={activeTool === 'text3d'} onClick={() => selectShape('text3d')} icon={<Heading size={20} />} title="3D Text Label" />
          </div>
        </div>
      )}

      {/* Colors Menu (Expanded) */}
      {openMenu === 'colors' && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-[#1e293b] border border-slate-600/50 p-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-200 z-50">
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Palette</div>
          <div className="grid grid-cols-5 gap-2">
            {COLORS.map(c => (
              <button 
                key={c} 
                onClick={() => selectColor(c)} 
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white scale-110 shadow-lg ring-2 ring-blue-500/50' : 'border-transparent'}`} 
                style={{ backgroundColor: c }} 
              />
            ))}
          </div>
        </div>
      )}

      {/* --- MAIN TOOLBAR GRID --- */}
      
      <div className="grid grid-cols-4 gap-2">
        <ToolBtn active={activeTool === 'translate'} onClick={() => setActiveTool('translate')} icon={<Move size={18} />} title="Move" />
        <ToolBtn active={activeTool === 'rotate'} onClick={() => setActiveTool('rotate')} icon={<RotateCw size={18} />} title="Rotate" />
        <ToolBtn active={activeTool === 'connect'} onClick={() => setActiveTool('connect')} icon={<Network size={18} />} title="Link" />
        
        <button 
            onClick={onDelete} 
            disabled={!selectedId} 
            className={`p-2 rounded-lg flex items-center justify-center transition-all ${selectedId ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' : 'text-slate-700 cursor-not-allowed'}`}
            title="Delete Selected"
        >
            <Trash2 size={18} />
        </button>
      </div>

      <div className="h-px bg-slate-700/50 w-full" />

      <div className="grid grid-cols-4 gap-2">
        <ToolBtn active={activeTool === 'pen'} onClick={() => setActiveTool('pen')} icon={<PenTool size={18} />} title="Draw" />
        <ToolBtn active={activeTool === 'eraser'} onClick={() => setActiveTool('eraser')} icon={<Eraser size={18} />} title="Eraser" />
        <ToolBtn active={activeTool === 'text'} onClick={() => setActiveTool('text')} icon={<Type size={18} />} title="Note" />
        
        <button 
            onClick={() => toggleMenu('shapes')} 
            className={`p-2 rounded-lg flex items-center justify-center transition-all ${['cube', 'sphere', 'cylinder', 'cone', 'torus', 'database', 'text3d'].includes(activeTool) ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            title="Shapes Library"
        >
            {openMenu === 'shapes' ? <X size={18} /> : <Shapes size={18} />}
        </button>
      </div>

      <div className="h-px bg-slate-700/50 w-full" />

      <button 
        onClick={() => toggleMenu('colors')}
        className="w-full flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all group"
      >
        <div className="w-5 h-5 rounded-full border border-slate-500/50 shadow-sm group-hover:scale-110 transition-transform" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium text-slate-400 group-hover:text-white">Color</span>
        <Palette size={14} className="ml-auto text-slate-500" />
      </button>

    </div>
  );
}

function ToolBtn({ active, onClick, icon, title }) {
    return (
        <button 
            onClick={onClick} 
            className={`p-2 rounded-lg flex items-center justify-center transition-all aspect-square ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            title={title}
        >
            {icon}
        </button>
    );
}