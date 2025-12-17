import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ChatbotPage = () => {
  const navigate = useNavigate();
  
  // --- UI STATE ---
  const [isCollapsed, setIsCollapsed] = useState(true);
  const messagesEndRef = useRef(null);

  // --- CHAT & LOGIC STATE ---
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true); // Loading state for sidebar
  
  // Chat History
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello, I am the Assembly Line AI. I have analyzed your Knowledge Graph. Please select a specific machine and data sources to begin diagnostics.",
      trace: []
    }
  ]);

  // --- DYNAMIC FILTERS STATE ---
  const [availableMachines, setAvailableMachines] = useState([]);
  const [availableSources, setAvailableSources] = useState([]);
  
  // Selections
  const [selectedMachine, setSelectedMachine] = useState(""); // Stores selected machine name
  const [selectedSources, setSelectedSources] = useState({}); // Stores { "Source Name": true/false }

  // Debug Trace Log
  const [lastTrace, setLastTrace] = useState([]);

  // --- EFFECTS ---
  
  // 1. Fetch Filters (Machines & Sources) on Mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/agent/filters');
        if (!response.ok) throw new Error("Failed to fetch filters");
        
        const data = await response.json();
        
        // Update Machine List
        setAvailableMachines(data.machinery || []);
        if (data.machinery.length > 0) {
            setSelectedMachine(data.machinery[0]); // Select first machine by default
        }

        // Update Sources List & Initialize Checkboxes
        setAvailableSources(data.sources || []);
        
        const initialSourceState = {};
        (data.sources || []).forEach(source => {
            initialSourceState[source] = true; // Default all to true
        });
        setSelectedSources(initialSourceState);

      } catch (error) {
        console.error("Error loading filters:", error);
        // Fallback or Error Notification
      } finally {
        setIsFiltersLoading(false);
      }
    };

    fetchFilters();
  }, []);

  // 2. Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // --- HANDLERS ---

  const handleLogout = () => {
    navigate('/');
  };

  const toggleSource = (sourceName) => {
    setSelectedSources(prev => ({
      ...prev,
      [sourceName]: !prev[sourceName]
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput(""); 
    setIsLoading(true);

    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

    // Filter active sources
    const activeSourcesList = Object.keys(selectedSources).filter(key => selectedSources[key]);

    try {
      const response = await fetch('http://localhost:8000/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage,
          selected_sources: activeSourcesList,
          selected_machine: selectedMachine // SENDING SELECTED MACHINE
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: data.answer,
        trace: data.trace 
      }]);
      
      setLastTrace(data.trace || []);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "⚠️ Connection Error: Could not reach the FactoryOS Agent." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen font-['Noto_Sans',sans-serif] antialiased overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] text-slate-900 dark:text-white flex flex-row">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Noto+Sans:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .dark ::-webkit-scrollbar { width: 8px; height: 8px; }
        .dark ::-webkit-scrollbar-track { background: #101922; }
        .dark ::-webkit-scrollbar-thumb { background: #324d67; border-radius: 4px; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #476a8b; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* --- LEFT NAVIGATION SIDEBAR --- */}
      <div 
        className={`hidden md:flex flex-col border-r border-slate-200 dark:border-[#283039] bg-white dark:bg-[#111418] flex-shrink-0 transition-all duration-300 ease-in-out z-50 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <div className="flex flex-col h-full p-4 justify-between">
          <div className="flex flex-col gap-8">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
              <div className="flex items-center gap-2 text-[#137fec]">
                <span className="material-symbols-outlined text-[32px]">precision_manufacturing</span>
                {!isCollapsed && (
                  <h1 className="text-xl font-['Space_Grotesk',sans-serif] font-bold tracking-tight whitespace-nowrap">FactoryOS</h1>
                )}
              </div>
            </div>
            
            {/* --- UPDATED NAVIGATION --- */}
            <div className="flex flex-col gap-2">
              {/* Dashboard */}
              <button onClick={() => navigate('/dashboard')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c252e] transition-colors group ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                <span className="material-symbols-outlined text-[20px]">dns</span>
                {!isCollapsed && <p className="text-sm font-medium whitespace-nowrap">Data Sources</p>}
              </button>

              {/* Resources (NEW) */}
              <button onClick={() => navigate('/resources')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c252e] transition-colors group ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                <span className="material-symbols-outlined text-[20px]">group_add</span>
                {!isCollapsed && <p className="text-sm font-medium whitespace-nowrap">Resources</p>}
              </button>

              {/* Compliance (NEW LINK) */}
              <button onClick={() => navigate('/compliance')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c252e] transition-colors group ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
                {!isCollapsed && <p className="text-sm font-medium whitespace-nowrap">Compliance</p>}
              </button>

              {/* Agents (Active Page) */}
              <button className={`flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#137fec] text-white shadow-lg shadow-[#137fec]/20 transition-all ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                {!isCollapsed && <p className="text-sm font-medium whitespace-nowrap">Agents</p>}
              </button>
            </div>
          </div>
          <div className="px-2 pb-2">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-3 rounded-xl bg-slate-100 dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] transition-all`}>
              <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center text-white font-bold text-xs">AD</div>
              {!isCollapsed && (
                <>
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-sm font-bold leading-none dark:text-white truncate">Admin User</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">FactoryOS</p>
                  </div>
                  <button onClick={handleLogout} className="ml-auto text-slate-400 hover:text-red-400 transition-colors">
                    <span className="material-symbols-outlined text-lg">logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] relative">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-[#233648] px-6 py-3 bg-white dark:bg-[#101922] z-20 shrink-0">
            <div className="flex items-center gap-4">
                <div className="size-8 text-[#137fec] flex items-center justify-center rounded-lg bg-[#137fec]/10">
                    <span className="material-symbols-outlined text-2xl">precision_manufacturing</span>
                </div>
                <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight font-['Space_Grotesk',sans-serif]">Assembly Line AI Admin</h2>
            </div>
            <div className="flex flex-1 justify-end gap-8">
                <div className="flex items-center gap-4">
                    <div className="h-8 w-[1px] bg-slate-200 dark:bg-[#233648]"></div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">System Status:</span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Online
                        </span>
                    </div>
                </div>
            </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
            
            {/* 1. DYNAMIC CONFIGURATION SIDEBAR */}
            <aside className="w-80 flex flex-col border-r border-slate-200 dark:border-[#233648] bg-white dark:bg-[#1a2632] overflow-y-auto shrink-0 z-10 hidden md:flex">
                <div className="p-5 border-b border-slate-200 dark:border-[#233648]">
                    <h3 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#137fec] text-lg">tune</span>
                        Query Scope
                    </h3>
                    <label className="flex flex-col w-full mb-4">
                        <p className="text-slate-600 dark:text-slate-300 text-xs font-medium leading-normal pb-2">Target Machine Asset</p>
                        <div className="relative">
                            <select 
                              value={selectedMachine}
                              onChange={(e) => setSelectedMachine(e.target.value)}
                              disabled={isFiltersLoading}
                              className="appearance-none w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#137fec] border border-slate-300 dark:border-[#324d67] bg-white dark:bg-[#101922] h-11 pl-4 pr-10 text-sm font-medium shadow-sm transition-all hover:border-slate-400 dark:hover:border-slate-500 cursor-pointer disabled:opacity-50"
                            >
                                {isFiltersLoading ? (
                                   <option>Loading Graph Data...</option>
                                ) : availableMachines.length === 0 ? (
                                   <option>No Machines Found</option>
                                ) : (
                                   availableMachines.map((machine, idx) => (
                                     <option key={idx} value={machine}>{machine}</option>
                                   ))
                                )}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                <span className="material-symbols-outlined text-sm">expand_more</span>
                            </div>
                        </div>
                    </label>
                </div>
                <div className="p-5 flex-1">
                    <h3 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#137fec] text-lg">dataset</span>
                        Data Sources
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">Select active knowledge bases for the agent to query against.</p>
                    
                    {/* DYNAMIC CHECKBOX LIST */}
                    {isFiltersLoading ? (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                            Syncing with Graph...
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {availableSources.length === 0 && <p className="text-sm text-slate-500">No sources found in index.</p>}
                            {availableSources.map((source) => (
                                <label key={source} className="group flex gap-x-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#233648] cursor-pointer transition-colors">
                                    <input 
                                        type="checkbox"
                                        checked={!!selectedSources[source]}
                                        onChange={() => toggleSource(source)}
                                        className="h-4 w-4 rounded border-slate-300 dark:border-[#324d67] bg-transparent text-[#137fec] focus:ring-offset-0 focus:ring-[#137fec]/20 dark:focus:ring-offset-[#101922]" 
                                    />
                                    <span className={`text-sm font-medium leading-none transition-colors ${selectedSources[source] ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {source}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {/* 2. CENTER CHAT INTERFACE */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#f6f7f8] dark:bg-[#101922] relative">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="flex justify-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-200 dark:bg-[#233648] px-3 py-1 rounded-full">Today</span>
                    </div>
                    
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`size-8 rounded-full flex items-center justify-center text-white shadow-lg ${msg.role === 'user' ? 'bg-slate-400' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                                    {msg.role === 'user' ? <span className="text-xs font-bold">U</span> : <span className="material-symbols-outlined text-sm">smart_toy</span>}
                                </div>
                                <span className="text-xs font-bold text-slate-500">{msg.role === 'user' ? 'Admin User' : 'Assembly Agent'}</span>
                            </div>
                            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-[#137fec] text-white rounded-tr-sm' : 'bg-white dark:bg-[#1a2632] border border-slate-200 dark:border-[#233648] text-slate-800 dark:text-slate-200 rounded-tl-sm'}`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex flex-col items-start gap-2">
                            <div className="flex items-center gap-2">
                                <div className="size-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg">
                                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                                </div>
                                <span className="text-xs font-bold text-slate-500">Assembly Agent</span>
                            </div>
                            <div className="flex items-center gap-1 ml-4 bg-white dark:bg-[#1a2632] px-4 py-3 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-[#233648]">
                                <span className="size-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                                <span className="size-1.5 rounded-full bg-slate-400 animate-bounce delay-100"></span>
                                <span className="size-1.5 rounded-full bg-slate-400 animate-bounce delay-200"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-6 pt-2 bg-gradient-to-t from-[#f6f7f8] dark:from-[#101922] via-[#f6f7f8] dark:via-[#101922] to-transparent">
                    <div className="relative flex items-end gap-2 bg-white dark:bg-[#1a2632] border border-slate-300 dark:border-[#324d67] rounded-xl p-2 shadow-lg dark:shadow-none focus-within:ring-2 focus-within:ring-[#137fec]/50 focus-within:border-[#137fec] transition-all">
                        <textarea 
                            className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm resize-none py-2.5 max-h-32 focus:outline-none" 
                            placeholder="Ask about machine status, errors, or maintenance..." 
                            rows="1"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                        ></textarea>
                        <button 
                            onClick={handleSendMessage}
                            disabled={isLoading}
                            className={`p-2 rounded-lg transition-colors shadow-md ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#137fec] hover:bg-blue-600 text-white'}`}
                        >
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 mt-2">
                        Active Scope: {selectedMachine || "None"} | Sources: {Object.keys(selectedSources).filter(k => selectedSources[k]).length}
                    </p>
                </div>
            </main>

            {/* 3. RIGHT SIDEBAR: DEBUG CONSOLE */}
            <aside className="w-96 flex flex-col border-l border-slate-200 dark:border-[#233648] bg-white dark:bg-[#0b1219] shrink-0 z-10 shadow-xl hidden xl:flex">
                <div className="flex items-center border-b border-slate-200 dark:border-[#233648]">
                    <button className="flex-1 px-4 py-3 text-sm font-medium border-b-2 border-[#137fec] text-slate-900 dark:text-white bg-white dark:bg-[#1a2632]">
                        Agent Trace
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                    {lastTrace.length === 0 ? (
                        <div className="text-slate-500 italic text-center mt-10">No trace available.</div>
                    ) : (
                        lastTrace.map((step, i) => (
                            <div key={i} className="mb-4 relative pl-4 border-l border-slate-300 dark:border-[#233648]">
                                <div className="absolute -left-1.5 top-0 size-3 rounded-full bg-blue-500 border-2 border-[#0b1219]"></div>
                                <div className="mb-1 flex items-center gap-2"><span className="text-blue-500 font-bold">STEP {i + 1}</span></div>
                                <div className="bg-slate-100 dark:bg-[#101922] p-2 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#233648]">{step}</div>
                            </div>
                        ))
                    )}
                </div>
            </aside>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;