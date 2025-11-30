import React from 'react';
import { Box, Database, Type, Eye, MousePointer2 } from 'lucide-react';

export default function ObjectExplorer({ elements, onNavigate, selectedId }) {
  const getIcon = (type) => {
    switch (type) {
      case 'cube': return <Box size={14} className="text-blue-400" />;
      case 'database': return <Database size={14} className="text-green-400" />;
      case 'note': return <Type size={14} className="text-yellow-400" />;
      default: return <MousePointer2 size={14} className="text-slate-400" />;
    }
  };

  const items = elements.filter(e => e.type !== 'connection' && e.type !== 'line');

  return (
    <div className="bg-[#0f172a] border border-slate-700/50 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Explorer</span>
        <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">{items.length}</span>
      </div>

      <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
        {items.length === 0 ? (
          <div className="text-center py-8 text-slate-600 text-xs italic">
            Scene is empty
          </div>
        ) : (
          items.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-all group border border-transparent ${
                selectedId === item.id 
                  ? 'bg-blue-600/10 border-blue-500/30 text-blue-100' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {getIcon(item.type)}
              <span className="truncate flex-1 text-left text-xs font-medium">
                {item.type === 'note' && item.text ? item.text : 
                 item.type === 'text3d' && item.text ? item.text :
                 `${item.type} ${item.id.slice(-4)}`}
              </span>
              {selectedId === item.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}