import React from 'react';

const CitationGallery = ({ citations, onCitationClick, activeNodeId }) => {
  return (
    <div className="flex flex-col gap-3 p-4">
      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">menu_book</span>
        Verified Sources
      </h4>
      
      {citations.map((cite) => (
        <div 
          key={cite.id}
          onClick={() => onCitationClick(cite.node_id)}
          className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
            activeNodeId === cite.node_id 
              ? 'bg-[#137fec]/10 border-[#137fec] shadow-md' 
              : 'bg-white dark:bg-[#1a2632] border-slate-200 dark:border-[#233648] hover:border-[#137fec]/50'
          }`}
        >

        // Inside the map in CitationGallery.jsx
<div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-[#233648]">
  <button 
    onClick={(e) => {
      e.stopPropagation(); // Prevent highlighting graph if you just want to open modal
      onOpenModal(cite);
    }}
    className="text-[10px] font-bold text-[#137fec] flex items-center gap-1 hover:underline"
  >
    <span className="material-symbols-outlined text-xs">manage_search</span>
    Audit Evidence
  </button>
</div>

          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-[#137fec] truncate max-w-[180px]">
              {cite.source_name}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0b1219] text-slate-500 font-mono">
                {Math.round(cite.confidence * 100)}% Match
            </span>
          </div>
          
          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 italic leading-relaxed">
            "{cite.snippet}"
          </p>
          
          {cite.page_number && (
            <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                <span className="material-symbols-outlined text-[12px]">find_in_page</span>
                Page {cite.page_number}
            </div>
          )}
          
          {/* Visual indicator that this is "linked" to the graph */}
          <div className={`absolute right-2 bottom-2 size-1.5 rounded-full ${activeNodeId === cite.node_id ? 'bg-[#137fec] animate-pulse' : 'bg-slate-300'}`}></div>
        </div>
      ))}
    </div>
  );
};

export default CitationGallery;