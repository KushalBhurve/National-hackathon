import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GraphVisualizer from './GraphVisualizer';
import CitationGallery from './CitationGallery';
import CitationModal from './CitationModal';

const ChatbotPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- MODAL STATE ---
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);
  const [isReferencesListOpen, setIsReferencesListOpen] = useState(false);
  const openAuditModal = (citation) => { setActiveCitation(citation); setIsDetailModalOpen(true); };
  
  // --- UI STATE ---
  const [isCollapsed, setIsCollapsed] = useState(true);
  const messagesEndRef = useRef(null);

  // --- CHAT & LOGIC STATE ---
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);
  const [messages, setMessages] = useState([{ role: 'assistant', text: "Hello, I am the FactoryOS Agent. I have analyzed your Knowledge Graph. Please select a specific machine and data sources to begin diagnostics.", trace: [] }]);

  // --- DYNAMIC FILTERS STATE ---
  const [availableMachines, setAvailableMachines] = useState([]);
  const [availableSources, setAvailableSources] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(""); 
  const [selectedSources, setSelectedSources] = useState({}); 
  const [lastTrace, setLastTrace] = useState({ nodes: [], links: [] });
  const [currentCitations, setCurrentCitations] = useState([]); 
  const [selectedNodeId, setSelectedNodeId] = useState(null); 

  // --- EFFECTS ---
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/agent/filters');
        if (!response.ok) throw new Error("Failed to fetch filters");
        const data = await response.json();
        setAvailableMachines(data.machinery || []);
        if (data.machinery.length > 0) { setSelectedMachine(data.machinery[0]); }
        setAvailableSources(data.sources || []);
        const initialSourceState = {};
        (data.sources || []).forEach(source => { initialSourceState[source] = true; });
        setSelectedSources(initialSourceState);
      } catch (error) { console.error("Error loading filters:", error); } finally { setIsFiltersLoading(false); }
    };
    fetchFilters();
  }, []);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);
  const handleCitationClick = (nodeId) => { setSelectedNodeId(nodeId); };

  const toggleSource = (sourceName) => { setSelectedSources(prev => ({ ...prev, [sourceName]: !prev[sourceName] })); };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setInput(""); 
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    const activeSourcesList = Object.keys(selectedSources).filter(key => selectedSources[key]);
    try {
      const response = await fetch('http://localhost:8000/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, selected_sources: activeSourcesList, selected_machine: selectedMachine }),
      });
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.answer, trace: data.trace, citations: data.citations || [] }]);
      setLastTrace(data.trace && data.trace.nodes ? data.trace : { nodes: [], links: [] });
      setCurrentCitations(data.citations || []); 
    } catch (error) { console.error("Chat Error:", error); setMessages(prev => [...prev, { role: 'assistant', text: "⚠️ Connection Error: Could not reach the FactoryOS Agent." }]); } finally { setIsLoading(false); }
  };

  const navItems = [
    { label: 'Data Sources', icon: 'dns', path: '/dashboard' },
    { label: 'Resources', icon: 'group_add', path: '/resources' },
    { label: 'Compliance', icon: 'fact_check', path: '/compliance' },
    { label: 'Agents', icon: 'smart_toy', path: '/agent' },
    { label: 'Architecture', icon: 'hub', path: '/system-flow' },
  ];

  return (
    <div className="flex h-screen w-full bg-neutral-950 text-neutral-200 font-sans overflow-hidden selection:bg-cyan-500/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        :root { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #262626; border-radius: 3px; }
        .glass-panel { background: rgba(23, 23, 23, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .modal-overlay { background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); }
      `}</style>

      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      {/* --- STANDARDIZED SIDEBAR --- */}
      <div className={`relative z-50 flex flex-col border-r border-neutral-800 bg-neutral-900/90 backdrop-blur-xl transition-all duration-500 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'}`} onMouseEnter={() => setIsCollapsed(false)} onMouseLeave={() => setIsCollapsed(true)}>
        <div className="flex flex-col h-full p-4 justify-between">
          <div className="flex flex-col gap-8">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start px-2'}`}>
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                <div className="relative flex items-center justify-center text-cyan-400"><span className="material-symbols-outlined text-[32px]">precision_manufacturing</span></div>
              </div>
              {!isCollapsed && <h1 className="ml-3 text-xl font-bold tracking-tight text-white font-['Space_Grotesk']">Factory<span className="text-cyan-400">OS</span></h1>}
            </div>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button key={item.label} onClick={() => navigate(item.path)} className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-neutral-400 hover:text-white hover:bg-white/5'} ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                    <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-1' : ''}`}>{item.icon}</span>
                    {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </button>
                )
              })}
            </nav>
          </div>
          <div className="px-2 pb-2">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-3 rounded-xl bg-neutral-800/50 border border-white/5`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neutral-600 to-neutral-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-black">AD</div>
              {!isCollapsed && <button onClick={() => navigate('/')} className="ml-auto text-neutral-500 hover:text-red-400"><span className="material-symbols-outlined text-lg">logout</span></button>}
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN WRAPPER --- */}
      <div className="flex-1 flex flex-col h-full relative z-10 bg-neutral-950/50 backdrop-blur-sm">
        <header className="h-16 shrink-0 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md flex items-center justify-between px-6 z-20">
            <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400"><span className="material-symbols-outlined text-xl">precision_manufacturing</span></div>
                <h2 className="text-white text-base font-semibold tracking-wide font-['Space_Grotesk']">Assembly Line AI <span className="text-neutral-500 font-normal mx-2">/</span> <span className="text-cyan-400">Diagnostics</span></h2>
            </div>
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">System Online</span>
            </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
            {/* 2. DYNAMIC CONFIG (Left) */}
            <aside className="hidden md:flex w-72 flex-col border-r border-neutral-800 bg-neutral-900/40 shrink-0">
                <div className="p-6 border-b border-neutral-800/50">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-cyan-500 text-sm">tune</span> Context Scope</h3>
                    <div className="mb-6">
                        <label className="text-xs font-medium text-neutral-300 block mb-2">Target Asset</label>
                        <div className="relative group">
                            <select value={selectedMachine} onChange={(e) => setSelectedMachine(e.target.value)} disabled={isFiltersLoading} className="appearance-none w-full bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white px-4 py-2.5 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all disabled:opacity-50 hover:border-neutral-700">
                                {isFiltersLoading ? <option>Loading Nodes...</option> : availableMachines.length === 0 ? <option>No Machines Found</option> : availableMachines.map((m, i) => <option key={i} value={m}>{m}</option>)}
                            </select>
                            <div className="pointer-events-none absolute right-3 top-2.5 text-neutral-500 group-hover:text-cyan-500 transition-colors"><span className="material-symbols-outlined text-sm">expand_more</span></div>
                        </div>
                    </div>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-cyan-500 text-sm">dataset</span> Knowledge Base</h3>
                    {isFiltersLoading ? (<div className="flex items-center gap-2 text-neutral-500 text-xs animate-pulse"><span className="material-symbols-outlined text-sm">sync</span>Syncing Graph Index...</div>) : (
                        <div className="space-y-1">
                            {availableSources.map((source) => (
                                <label key={source} className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-800/50 cursor-pointer transition-all border border-transparent hover:border-neutral-800">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedSources[source] ? 'bg-cyan-500 border-cyan-500' : 'border-neutral-600 bg-transparent'}`}>{selectedSources[source] && <span className="material-symbols-outlined text-[10px] text-black font-bold">check</span>}</div>
                                    <input type="checkbox" className="hidden" checked={!!selectedSources[source]} onChange={() => toggleSource(source)} />
                                    <span className={`text-xs font-medium transition-colors ${selectedSources[source] ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'}`}>{source}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {/* 3. CHAT INTERFACE */}
            <main className="flex-1 flex flex-col min-w-0 bg-neutral-950/30 relative">
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
                    <div className="flex justify-center pb-4"><span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50">Session Started</span></div>
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-center gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`size-8 rounded-lg flex items-center justify-center shadow-lg border ${msg.role === 'user' ? 'bg-neutral-800 border-neutral-700 text-neutral-400' : 'bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-400/20 text-white'}`}>{msg.role === 'user' ? <span className="text-xs font-bold">U</span> : <span className="material-symbols-outlined text-sm">smart_toy</span>}</div>
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">{msg.role === 'user' ? 'Admin' : 'Agent'}</span>
                            </div>
                            <div className={`relative max-w-[85%] p-5 rounded-2xl shadow-xl backdrop-blur-sm border ${msg.role === 'user' ? 'bg-neutral-800 text-white border-neutral-700 rounded-tr-none' : 'glass-panel text-neutral-200 rounded-tl-none'}`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                {msg.role === 'assistant' && <div className="absolute inset-0 rounded-2xl bg-cyan-500/5 pointer-events-none rounded-tl-none"></div>}
                            </div>
                        </div>
                    ))}
                    {isLoading && (<div className="flex flex-col items-start gap-2 animate-pulse"><div className="flex items-center gap-2"><div className="size-8 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center"><span className="material-symbols-outlined text-sm text-cyan-500 animate-spin">sync</span></div><span className="text-[10px] font-bold text-neutral-500 uppercase">Processing</span></div></div>)}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-6 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent z-10">
                    <div className="relative group rounded-xl bg-neutral-900/80 border border-neutral-800 shadow-2xl transition-all focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/20">
                        <textarea className="w-full bg-transparent text-sm text-white placeholder:text-neutral-500 p-4 pr-14 resize-none focus:outline-none scrollbar-hide" placeholder="Query the machine graph..." rows="1" style={{ minHeight: '56px' }} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}></textarea>
                        <button onClick={handleSendMessage} disabled={isLoading} className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all duration-200 ${isLoading ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' : 'bg-cyan-500 text-black hover:bg-cyan-400'}`}><span className="material-symbols-outlined text-xl">arrow_upward</span></button>
                    </div>
                </div>
            </main>

            {/* 4. RIGHT SIDEBAR */}
            <aside className="w-[400px] hidden lg:flex flex-col border-l border-neutral-800 bg-neutral-900/60 backdrop-blur-md shadow-2xl relative z-20">
                <div className="shrink-0 px-4 py-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900"><span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 font-mono">Knowledge Graph Trail</span><div className="flex gap-1"><span className="w-1 h-1 rounded-full bg-neutral-600"></span><span className="w-1 h-1 rounded-full bg-neutral-600"></span><span className="w-1 h-1 rounded-full bg-neutral-600"></span></div></div>
                <div className="h-[40%] relative border-b border-neutral-800 bg-black/40 overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    {lastTrace?.nodes?.length > 0 ? (<GraphVisualizer traceData={lastTrace} activeNodeId={selectedNodeId} dimensions={{ width: 400, height: 350 }} />) : (<div className="flex flex-col items-center justify-center h-full text-neutral-700"><span className="material-symbols-outlined text-4xl mb-2 opacity-50">hub</span><p className="text-[10px] font-mono tracking-wider">NO ACTIVE TRAVERSAL</p></div>)}
                </div>
                <div className="flex-1 flex flex-col border-b border-neutral-800 bg-[#050505] overflow-hidden">
                    <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center gap-2"><span className="material-symbols-outlined text-xs text-neutral-500">terminal</span><span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Execution Trace</span></div>
                    <div className="flex-1 p-4 font-mono text-[10px] space-y-2 overflow-y-auto text-neutral-400">
                        <div className="flex gap-2"><span className="text-cyan-500">➜</span><span>System initialized...</span></div>
                        {selectedMachine && <div className="flex gap-2"><span className="text-emerald-500">✓</span><span>Context loaded: <span className="text-white">{selectedMachine}</span></span></div>}
                        {messages.length > 1 && <><div className="flex gap-2"><span className="text-purple-500">⚡</span><span>Retrieving hybrid embeddings...</span></div><div className="flex gap-2"><span className="text-emerald-500">✓</span><span>Generation complete.</span></div></>}
                        <span className="animate-pulse text-cyan-500">_</span>
                    </div>
                </div>
                <div className="p-4 bg-neutral-900 border-t border-neutral-800">
                    <button onClick={() => setIsReferencesListOpen(true)} className="group w-full flex items-center justify-between p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 transition-all duration-300">
                        <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-neutral-900 text-cyan-500 group-hover:text-cyan-400 border border-neutral-700 group-hover:border-cyan-500/30 transition-colors"><span className="material-symbols-outlined text-lg">library_books</span></div><div className="flex flex-col items-start"><span className="text-sm font-bold text-white group-hover:text-cyan-100">References</span><span className="text-[10px] text-neutral-500 group-hover:text-neutral-400">View Retrieved Sources</span></div></div>
                        <div className="flex items-center gap-2"><span className="px-2 py-1 rounded bg-neutral-900 border border-neutral-700 text-[10px] font-mono text-cyan-500">{currentCitations.length}</span><span className="material-symbols-outlined text-neutral-500 group-hover:text-white transition-colors text-lg">chevron_right</span></div>
                    </button>
                </div>
                <div className="h-8 shrink-0 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between px-3"><span className="text-[9px] font-mono text-neutral-600">Nodes: {lastTrace.nodes?.length || 0}</span><span className="text-[9px] font-mono text-neutral-600">Links: {lastTrace.links?.length || 0}</span></div>
            </aside>
        </div>
      </div>

      {/* --- REFERENCES LIST MODAL --- */}
      {isReferencesListOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-200">
              <div className="absolute inset-0" onClick={() => setIsReferencesListOpen(false)}></div>
              <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-[#0a0a0a] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/50"><div className="flex items-center gap-3"><span className="material-symbols-outlined text-cyan-500">library_books</span><h3 className="text-lg font-bold text-white tracking-tight font-['Space_Grotesk']">Retrieved References</h3><span className="px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-xs text-neutral-400">{currentCitations.length} Total</span></div><button onClick={() => setIsReferencesListOpen(false)} className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"><span className="material-symbols-outlined">close</span></button></div>
                  <div className="flex-1 overflow-y-auto p-6 bg-neutral-950">
                      {currentCitations.length > 0 ? ( <CitationGallery citations={currentCitations} onCitationClick={handleCitationClick} onOpenModal={openAuditModal} activeNodeId={selectedNodeId} /> ) : ( <div className="h-full flex flex-col items-center justify-center text-neutral-600 gap-4"><div className="p-4 rounded-full bg-neutral-900 border border-neutral-800"><span className="material-symbols-outlined text-4xl opacity-50">content_paste_off</span></div><p className="text-sm font-medium">No citations available for this query.</p></div> )}
                  </div>
                  <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-900/50 flex justify-end"><button onClick={() => setIsReferencesListOpen(false)} className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium transition-colors border border-neutral-700">Close Viewer</button></div>
              </div>
          </div>
      )}
      <CitationModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} citation={activeCitation} />
    </div>
  );
};

export default ChatbotPage;