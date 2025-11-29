import React from 'react';
import { Box, Database, Type, Eye, MousePointer2 } from 'lucide-react';

export default function ObjectExplorer({ elements, onNavigate, selectedId }) {
  // Helper to pick icon based on type
  const getIcon = (type) => {
    switch (type) {
      case 'cube': return <Box size={14} className="text-blue-400" />;
      case 'database': return <Database size={14} className="text-green-400" />;
      case 'note': return <Type size={14} className="text-yellow-400" />;
      default: return <MousePointer2 size={14} className="text-slate-400" />;
    }
  };

  // Filter out connections (we usually don't want to list wires)
  const items = elements.filter(e => e.type !== 'connection' && e.type !== 'line');

  return (
    <div className="absolute top-20 left-4 w-64 bg-slate-800/90 backdrop-blur border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto max-h-[70vh]">
      {/* Header */}
      <div className="p-3 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Explorer</span>
        <span className="text-xs text-slate-500">{items.length} items</span>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
        {items.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No objects yet.<br/>Start building!
          </div>
        ) : (
          items.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-all group ${
                selectedId === item.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {getIcon(item.type)}
              <span className="truncate flex-1 text-left">
                {item.type === 'note' && item.text ? item.text : `${item.type} ${item.id.slice(0,4)}`}
              </span>
              <Eye size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedId === item.id ? 'text-blue-200' : 'text-slate-500'}`} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}