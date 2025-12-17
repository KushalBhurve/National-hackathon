import React from 'react';

const CitationModal = ({ isOpen, onClose, citation }) => {
  if (!isOpen || !citation) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1a2632] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-[#324d67] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#233648] flex justify-between items-center bg-slate-50 dark:bg-[#111418]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-[#137fec]/10 flex items-center justify-center text-[#137fec]">
              <span className="material-symbols-outlined">verified_user</span>
            </div>
            <div>
              <h3 className="text-sm font-bold dark:text-white uppercase tracking-tight">Source Audit Detail</h3>
              <p className="text-[10px] text-slate-500 font-mono">Node ID: {citation.node_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0b1219] border border-slate-200 dark:border-[#233648]">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Document Source</p>
              <p className="text-sm font-semibold text-[#137fec]">{citation.source_name}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0b1219] border border-slate-200 dark:border-[#233648]">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Fidelity Score</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${citation.confidence * 100}%` }}></div>
                </div>
                <span className="text-xs font-bold text-emerald-500">{Math.round(citation.confidence * 100)}%</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Evidence Snippet</p>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0b1219] border-l-4 border-[#137fec] font-['Noto_Sans'] text-sm leading-relaxed dark:text-slate-300 italic">
              "{citation.snippet}"
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-4">
               <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">find_in_page</span> Page {citation.page_number || 'N/A'}</span>
               <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">history</span> Retrieved: {new Date().toLocaleTimeString()}</span>
            </div>
            <button className="px-4 py-2 bg-[#137fec] hover:bg-blue-600 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              Open Full PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitationModal;