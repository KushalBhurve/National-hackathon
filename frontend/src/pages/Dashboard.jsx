import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  // Sidebar State
  const [isCollapsed, setIsCollapsed] = useState(true);

  // --- NEW: Ingestion / Modal State ---
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Form Data State
  const [machinery, setMachinery] = useState('');
  const [manualType, setManualType] = useState('Maintenance Manual');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // API Status State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null

  // Ref for clicking outside dropdown
  const addMenuRef = useRef(null);

  const handleLogout = () => {
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- NEW: Handle File Selection ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // --- NEW: Handle API Submission ---
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !machinery) return;

    setIsUploading(true);
    setUploadStatus(null);

    // Prepare FormData for FastAPI
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('machinery', machinery);
    formData.append('manual_type', manualType);

    try {
      // Assuming backend is running on localhost:8000
      const response = await fetch('http://localhost:8000/api/ingest', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      console.log("Server Response:", data);
      
      setUploadStatus('success');
      // Reset form after short delay
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadStatus(null);
        setMachinery('');
        setSelectedFile(null);
      }, 1500);

    } catch (error) {
      console.error(error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen font-['Noto_Sans',sans-serif] antialiased overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] text-slate-900 dark:text-white flex flex-row relative">
      {/* Inject Fonts and Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Noto+Sans:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        
        .dark ::-webkit-scrollbar { width: 8px; height: 8px; }
        .dark ::-webkit-scrollbar-track { background: #101922; }
        .dark ::-webkit-scrollbar-thumb { background: #283039; border-radius: 4px; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #3e4851; }
        
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Sidebar with Transition and Hover functionality */}
      <div 
        className={`hidden md:flex flex-col border-r border-slate-200 dark:border-[#283039] bg-white dark:bg-[#111418] flex-shrink-0 transition-all duration-300 ease-in-out z-40 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <div className="flex flex-col h-full p-4 justify-between">
          <div className="flex flex-col gap-8">
            {/* Header Area */}
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
              <div className="flex items-center gap-2 text-[#137fec]">
                <svg className="size-8 flex-shrink-0" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
                </svg>
                {!isCollapsed && (
                  <h1 className="text-xl font-['Space_Grotesk',sans-serif] font-bold tracking-tight whitespace-nowrap text-slate-900 dark:text-white">FactoryOS</h1>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                {!isCollapsed && (
                  <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 transition-opacity duration-300">Modules</p>
                )}
                
                {/* Data Sources (Active) */}
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#137fec] text-white shadow-lg shadow-[#137fec]/20 transition-all ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">dns</span>
                  {!isCollapsed && <p className="text-sm font-medium whitespace-nowrap">Data Sources</p>}
                </button>

                {/* Knowledge Graph */}
                <button className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c252e] transition-colors group ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                  <span className="material-symbols-outlined text-[20px] group-hover:text-[#137fec]">hub</span>
                  {!isCollapsed && <p className="text-sm font-medium whitespace-nowrap">Knowledge Graph</p>}
                </button>
                
                {/* Compliance Checks */}
                <button 
                  onClick={() => navigate('/compliance')} 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c252e] transition-colors group ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                  <span className="material-symbols-outlined text-[20px] group-hover:text-[#137fec]">fact_check</span>
                  {!isCollapsed && <p className="text-sm font-medium whitespace-nowrap">Compliance</p>}
                </button>

                {/* Agentic AI */}
                <button 
                  onClick={() => navigate('/agent')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c252e] transition-colors group ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                  <span className="material-symbols-outlined text-[20px] group-hover:text-[#137fec]">smart_toy</span>
                  {!isCollapsed && <p className="text-sm font-medium whitespace-nowrap">Agents</p>}
                </button>
              </div>
              
              <div className="h-px bg-slate-200 dark:bg-[#283039] my-2 mx-3"></div>
              
              <div className="flex flex-col gap-1">
                {!isCollapsed && (
                  <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 transition-opacity duration-300">System</p>
                )}
                <a className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c252e] transition-colors group ${isCollapsed ? 'justify-center' : ''}`} href="#">
                  <span className="material-symbols-outlined text-[20px] group-hover:text-[#137fec]">monitoring</span>
                  {!isCollapsed && <p className="text-sm font-medium whitespace-nowrap">Monitoring</p>}
                </a>
                <a className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c252e] transition-colors group ${isCollapsed ? 'justify-center' : ''}`} href="#">
                  <span className="material-symbols-outlined text-[20px] group-hover:text-[#137fec]">settings</span>
                  {!isCollapsed && <p className="text-sm font-medium whitespace-nowrap">Settings</p>}
                </a>
              </div>
            </div>
          </div>
          
          {/* User Profile */}
          <div className="px-2 pb-2">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-3 rounded-xl bg-slate-100 dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] transition-all`}>
              <div className="w-8 h-8 rounded-full bg-cover bg-center border border-slate-300 dark:border-slate-600 flex-shrink-0" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD_R3NRNkxiphJLCbKy2oKTk9JYsChQ4tKe37Y2TWkw_WDYD6DeV2U3Hj4d_WzCgEM0Iy6nA5b1qQwTOiWdtnhBNeUL1krI0SYSnrXQ67bRiXgBaJT8QSqFvDY4g9XJIX7e5kx8Sgn2QMT0QqPh0mdkqrIs0903TC6OjLGOV0HvlPmUuedc2pR-CS8m7y5l_eFaK6mUMiXB1JjNiSLaGr8lfrXIcB-Z3nUP_s9KXLA--WtUVaSqiKMNTh3Aih2trfOVIxBKCOFaxgkx')"}}></div>
              {!isCollapsed && (
                <>
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-sm font-bold leading-none dark:text-white truncate">Admin User</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">FactoryOS</p>
                  </div>
                  <button onClick={handleLogout} className="ml-auto text-slate-400 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-lg">logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] relative">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-[1440px] mx-auto w-full">
                
                {/* Breadcrumbs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <a className="text-slate-500 dark:text-[#9dabb9] text-sm font-medium leading-normal hover:text-[#137fec] transition-colors" href="#">Home</a>
                    <span className="text-slate-400 dark:text-[#9dabb9] text-sm font-medium leading-normal">/</span>
                    <a className="text-slate-500 dark:text-[#9dabb9] text-sm font-medium leading-normal hover:text-[#137fec] transition-colors" href="#">Settings</a>
                    <span className="text-slate-400 dark:text-[#9dabb9] text-sm font-medium leading-normal">/</span>
                    <span className="text-slate-900 dark:text-white text-sm font-medium leading-normal">Data Sources</span>
                </div>

                {/* Page Heading & Actions */}
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl md:text-[32px] font-bold leading-tight font-['Space_Grotesk',sans-serif]">Data Source Management</h1>
                        <p className="text-slate-500 dark:text-[#9dabb9] text-sm font-normal leading-normal max-w-2xl">
                            Configure and monitor connections to assembly line machinery (SCADA, PLC) and enterprise knowledge bases. Manage ingestion pipelines for the AI agent fleet.
                        </p>
                    </div>
                    <div className="flex items-end relative" ref={addMenuRef}>
                        {/* MODIFIED: Button with Dropdown logic */}
                        <button 
                          onClick={() => setShowAddMenu(!showAddMenu)}
                          className="group flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-[#137fec] hover:bg-[#137fec]/90 transition-all text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] shadow-lg shadow-[#137fec]/20"
                        >
                            <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">add_circle</span>
                            <span className="truncate">Add New Source</span>
                        </button>
                        
                        {/* --- NEW: Dropdown Menu --- */}
                        {showAddMenu && (
                          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                             <div className="p-1">
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#283039] rounded-lg text-left">
                                   <span className="material-symbols-outlined text-[18px] text-amber-500">memory</span>
                                   Connect PLC/SCADA
                                </button>
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#283039] rounded-lg text-left">
                                   <span className="material-symbols-outlined text-[18px] text-emerald-500">api</span>
                                   Connect API/ERP
                                </button>
                                <div className="h-px bg-slate-100 dark:bg-[#283039] my-1"></div>
                                <button 
                                  onClick={() => { setShowAddMenu(false); setShowUploadModal(true); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#283039] rounded-lg text-left"
                                >
                                   <span className="material-symbols-outlined text-[18px] text-purple-500">upload_file</span>
                                   Upload Manual (PDF)
                                </button>
                             </div>
                          </div>
                        )}
                    </div>
                </div>

                {/* KPI Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-[#137fec]">dns</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal uppercase tracking-wider">Total Sources</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight font-['Space_Grotesk',sans-serif]">42</p>
                            <span className="text-emerald-500 text-xs font-medium flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 2
                            </span>
                        </div>
                    </div>
                    {/* ... (Other Stats Cards remain unchanged) ... */}
                    <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-emerald-500">sensors</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal uppercase tracking-wider">Active Streams</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight font-['Space_Grotesk',sans-serif]">38</p>
                            <span className="text-slate-400 text-xs font-medium">/ 42 Online</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-purple-500">hub</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal uppercase tracking-wider">Graph Nodes</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight font-['Space_Grotesk',sans-serif]">12.4k</p>
                            <span className="text-purple-400 text-xs font-medium">Entities Mapped</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-amber-500">speed</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal uppercase tracking-wider">Ingestion Rate</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight font-['Space_Grotesk',sans-serif]">450</p>
                            <span className="text-slate-400 text-sm font-medium">MB/s</span>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col lg:flex-row gap-6 mb-6">
                    {/* Sidebar / Filters */}
                    <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-6">
                        <div className="relative w-full">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">search</span>
                            <input className="w-full h-10 pl-10 pr-4 bg-white dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#137fec]/50 placeholder-slate-400" placeholder="Search sources, IDs..." type="text"/>
                        </div>
                        <div className="hidden lg:flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Source Type</h3>
                                <label className="flex items-center gap-3 p-2 rounded hover:bg-slate-100 dark:hover:bg-[#283039] cursor-pointer">
                                    <input defaultChecked className="rounded border-slate-300 dark:border-slate-600 bg-transparent text-[#137fec] focus:ring-[#137fec]" type="checkbox"/>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">SCADA & PLC</span>
                                    <span className="ml-auto text-xs text-slate-400">24</span>
                                </label>
                                <label className="flex items-center gap-3 p-2 rounded hover:bg-slate-100 dark:hover:bg-[#283039] cursor-pointer">
                                    <input className="rounded border-slate-300 dark:border-slate-600 bg-transparent text-[#137fec] focus:ring-[#137fec]" type="checkbox"/>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Documents (PDF)</span>
                                    <span className="ml-auto text-xs text-slate-400">12</span>
                                </label>
                                {/* ... other filters ... */}
                            </div>
                            {/* ... status filters ... */}
                        </div>
                    </div>
                    
                    {/* Main Grid Content */}
                    <div className="flex-1">
                        {/* Tabs (Mobile/Tablet view helper) */}
                        <div className="lg:hidden flex overflow-x-auto gap-2 mb-4 pb-2 hide-scrollbar">
                            <button className="px-4 py-2 rounded-full bg-[#137fec] text-white text-sm font-medium whitespace-nowrap">All Sources</button>
                            <button className="px-4 py-2 rounded-full bg-white dark:bg-[#283039] text-slate-700 dark:text-slate-300 text-sm font-medium whitespace-nowrap">SCADA</button>
                            <button className="px-4 py-2 rounded-full bg-white dark:bg-[#283039] text-slate-700 dark:text-slate-300 text-sm font-medium whitespace-nowrap">Documents</button>
                            <button className="px-4 py-2 rounded-full bg-white dark:bg-[#283039] text-slate-700 dark:text-slate-300 text-sm font-medium whitespace-nowrap">Offline</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {/* Card 1: SCADA Healthy */}
                            <div className="flex flex-col bg-white dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] rounded-xl p-5 hover:border-[#137fec]/50 transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[#137fec]">
                                            <span className="material-symbols-outlined">precision_manufacturing</span>
                                        </div>
                                        <div>
                                            <h3 className="text-slate-900 dark:text-white font-bold text-base leading-tight">Robotic Arm #4</h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Line A • Welding</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                        <span className="block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span className="text-[10px] font-bold uppercase tracking-wide">Live</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Protocol</p>
                                        <p className="text-sm font-mono text-slate-700 dark:text-slate-200">OPC UA</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Last Sync</p>
                                        <p className="text-sm font-mono text-slate-700 dark:text-slate-200">Just now</p>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-[#283039] flex justify-between items-center">
                                    <span className="text-xs text-slate-400">ID: src-29384</span>
                                    <button className="text-[#137fec] hover:text-[#137fec]/80 text-sm font-medium flex items-center gap-1">
                                        Manage <span className="material-symbols-outlined text-[16px]">settings</span>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Card 2: PLC Warning */}
                            {/* ... (Existing Cards kept for layout context) ... */}
                             <div className="flex flex-col bg-white dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] rounded-xl p-5 hover:border-amber-500/50 transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-500">
                                            <span className="material-symbols-outlined">memory</span>
                                        </div>
                                        <div>
                                            <h3 className="text-slate-900 dark:text-white font-bold text-base leading-tight">PLC Controller Main</h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Line B • Assembly</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                        <span className="material-symbols-outlined text-[14px]">warning</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wide">Degraded</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Protocol</p>
                                        <p className="text-sm font-mono text-slate-700 dark:text-slate-200">MQTT</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Latency</p>
                                        <p className="text-sm font-mono text-amber-500">450ms</p>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-[#283039] flex justify-between items-center">
                                    <span className="text-xs text-slate-400">ID: src-99120</span>
                                    <button className="text-[#137fec] hover:text-[#137fec]/80 text-sm font-medium flex items-center gap-1">
                                        Troubleshoot <span className="material-symbols-outlined text-[16px]">build</span>
                                    </button>
                                </div>
                            </div>

                            {/* Card 3: Documents PDF */}
                            <div className="flex flex-col bg-white dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] rounded-xl p-5 hover:border-[#137fec]/50 transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                            <span className="material-symbols-outlined">description</span>
                                        </div>
                                        <div>
                                            <h3 className="text-slate-900 dark:text-white font-bold text-base leading-tight">KUKA KR Quantec Manuals</h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Knowledge Base • Maintenance</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                        <span className="text-[10px] font-bold uppercase tracking-wide">Static</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Files</p>
                                        <p className="text-sm font-mono text-slate-700 dark:text-slate-200">14 PDFs</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Last Index</p>
                                        <p className="text-sm font-mono text-slate-700 dark:text-slate-200">2d ago</p>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-[#283039] flex justify-between items-center">
                                    <span className="text-xs text-slate-400">ID: doc-1102</span>
                                    <button className="text-[#137fec] hover:text-[#137fec]/80 text-sm font-medium flex items-center gap-1">
                                        Re-Index <span className="material-symbols-outlined text-[16px]">refresh</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Pagination */}
                        <div className="flex justify-center mt-8">
                            <div className="flex items-center gap-2">
                                <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-[#283039] text-slate-500 hover:bg-slate-100 dark:hover:bg-[#283039]">
                                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                </button>
                                <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#137fec] text-white font-medium text-sm">1</button>
                                <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-[#283039] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#283039] font-medium text-sm">2</button>
                                <span className="text-slate-400 px-1">...</span>
                                <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-[#283039] text-slate-500 hover:bg-slate-100 dark:hover:bg-[#283039]">
                                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ingestion Chart & Knowledge Graph Mini-View */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                   {/* ... Chart code (kept largely same for brevity, visual only) ... */}
                   <div className="lg:col-span-2 flex flex-col bg-white dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] rounded-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-slate-900 dark:text-white font-bold text-lg">Ingestion Throughput (Last 24h)</h3>
                            <div className="flex gap-2">
                                <span className="px-2 py-1 text-xs rounded-md bg-slate-100 dark:bg-[#283039] text-slate-600 dark:text-slate-400 font-medium">1h</span>
                                <span className="px-2 py-1 text-xs rounded-md bg-[#137fec]/20 text-[#137fec] font-medium">24h</span>
                                <span className="px-2 py-1 text-xs rounded-md bg-slate-100 dark:bg-[#283039] text-slate-600 dark:text-slate-400 font-medium">7d</span>
                            </div>
                        </div>
                        {/* Simple placeholder for chart area */}
                        <div className="w-full h-48 flex items-end gap-1 relative mt-auto">
                           <div className="flex-1 bg-[#137fec]/20 h-[30%] rounded-t-sm"></div>
                           <div className="flex-1 bg-[#137fec]/50 h-[60%] rounded-t-sm"></div>
                           <div className="flex-1 bg-[#137fec]/80 h-[90%] rounded-t-sm"></div>
                           <div className="flex-1 bg-[#137fec]/40 h-[50%] rounded-t-sm"></div>
                           <div className="flex-1 bg-[#137fec]/30 h-[40%] rounded-t-sm"></div>
                        </div>
                   </div>

                   {/* Topology Preview */}
                   <div className="flex flex-col bg-white dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] rounded-xl p-6 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-4 relative z-10">
                            <h3 className="text-slate-900 dark:text-white font-bold text-lg">Topology Preview</h3>
                            <button className="text-[#137fec] text-sm font-medium">Expand</button>
                        </div>
                        <div className="flex-1 relative rounded-lg bg-slate-50 dark:bg-[#101922] border border-slate-100 dark:border-[#283039] overflow-hidden min-h-[180px]">
                           {/* Decorative Nodes */}
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#137fec] rounded-full shadow-[0_0_15px_rgba(19,127,236,0.6)] z-20"></div>
                           <div className="absolute top-[30%] right-[30%] w-3 h-3 bg-purple-500 rounded-full z-10"></div>
                           <div className="absolute bottom-[40%] left-[20%] w-3 h-3 bg-emerald-500 rounded-full z-10"></div>
                        </div>
                   </div>
                </div>
            </div>
        </main>
      </div>

      {/* --- NEW: Upload Modal --- */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-[#1c252e] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-[#283039] animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-[#283039] flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Space_Grotesk',sans-serif]">Upload Manual</h3>
                 <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                    <span className="material-symbols-outlined">close</span>
                 </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleUpload} className="p-6 flex flex-col gap-4">
                 
                 {/* Machinery Input */}
                 <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Machinery Name</label>
                    <input 
                      type="text" 
                      required
                      value={machinery}
                      onChange={(e) => setMachinery(e.target.value)}
                      placeholder="e.g. Robotic Arm #4"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-[#283039] bg-slate-50 dark:bg-[#111418] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#137fec] outline-none transition-all"
                    />
                 </div>

                 {/* Manual Type Input */}
                 <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Manual Type</label>
                    <select 
                      value={manualType}
                      onChange={(e) => setManualType(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-[#283039] bg-slate-50 dark:bg-[#111418] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#137fec] outline-none transition-all"
                    >
                       <option value="Maintenance Manual">Maintenance Manual</option>
                       <option value="Safety Guide">Safety Guide</option>
                       <option value="Technical Specs">Technical Specs</option>
                       <option value="Operational Guide">Operational Guide</option>
                    </select>
                 </div>

                 {/* File Upload Area */}
                 <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Document (PDF)</label>
                    <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-[#283039] transition-colors cursor-pointer group">
                       <input 
                         type="file" 
                         accept="application/pdf"
                         onChange={handleFileChange}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                       />
                       <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-[#137fec] mb-2 transition-colors">upload_file</span>
                       <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                       </p>
                       <p className="text-xs text-slate-400 mt-1">PDF up to 50MB</p>
                    </div>
                 </div>

                 {/* Status Messages */}
                 {uploadStatus === 'success' && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg flex items-center gap-2">
                       <span className="material-symbols-outlined text-lg">check_circle</span>
                       Ingestion workflow started successfully.
                    </div>
                 )}
                 {uploadStatus === 'error' && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                       <span className="material-symbols-outlined text-lg">error</span>
                       Upload failed. Check server logs.
                    </div>
                 )}

                 {/* Footer Actions */}
                 <div className="flex justify-end gap-3 mt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#283039] rounded-lg transition-colors"
                    >
                       Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isUploading || !selectedFile || !machinery}
                      className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-lg shadow-[#137fec]/20 flex items-center gap-2 transition-all ${
                         isUploading || !selectedFile || !machinery 
                           ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' 
                           : 'bg-[#137fec] hover:bg-[#137fec]/90'
                      }`}
                    >
                       {isUploading && <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>}
                       {isUploading ? 'Ingesting...' : 'Start Ingestion'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;