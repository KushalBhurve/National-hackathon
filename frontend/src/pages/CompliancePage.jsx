import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CompliancePage = () => {
  const navigate = useNavigate();
  // Default to true (collapsed) so it opens on hover
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen font-['Inter',sans-serif] antialiased overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] text-slate-900 dark:text-white flex flex-row">
      {/* Inject Fonts and Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Noto+Sans:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        
        .dark ::-webkit-scrollbar { width: 8px; height: 8px; }
        .dark ::-webkit-scrollbar-track { background: #101922; }
        .dark ::-webkit-scrollbar-thumb { background: #283039; border-radius: 4px; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #3e4851; }
        
        .hide-scrollbar::-webkit-scrollbar { display: none; }

        .graph-line {
            stroke-dasharray: 4;
            animation: dash 30s linear infinite;
        }
        @keyframes dash {
            to { stroke-dashoffset: 1000; }
        }
      `}</style>

      {/* Sidebar with Hover Effect */}
      <div 
        className={`hidden md:flex flex-col border-r border-slate-200 dark:border-[#283039] bg-white dark:bg-[#111418] flex-shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <div className="flex flex-col h-full p-4 justify-between">
          <div className="flex flex-col gap-8">
            {/* Header Area */}
            <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between px-2'}`}>
              <div className="flex items-center gap-2 text-[#137fec]">
                <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
                </svg>
                {!isCollapsed && (
                  <h1 className="text-xl font-['Space_Grotesk',sans-serif] font-bold tracking-tight whitespace-nowrap text-slate-900 dark:text-white">FactoryOS</h1>
                )}
              </div>
              
              {/* Toggle Button (Manual override) */}
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1c252e] hover:text-[#137fec] transition-colors"
              >
                <span className="material-symbols-outlined text-xl">
                  {isCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
                </span>
              </button>
            </div>

            {/* Navigation */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                {!isCollapsed && (
                  <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 transition-opacity duration-300">Modules</p>
                )}
                
                {/* Data Sources */}
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c252e] transition-colors group ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}
                >
                  <span className="material-symbols-outlined text-[20px] group-hover:text-[#137fec]">dns</span>
                  {!isCollapsed && <p className="text-sm font-medium whitespace-nowrap">Data Sources</p>}
                </button>

                {/* Knowledge Graph */}
                <button className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c252e] transition-colors group ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                  <span className="material-symbols-outlined text-[20px] group-hover:text-[#137fec]">hub</span>
                  {!isCollapsed && <p className="text-sm font-medium whitespace-nowrap">Knowledge Graph</p>}
                </button>
                
                {/* Compliance Checks (Active) */}
                <button 
                  onClick={() => navigate('/compliance')} 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#137fec] text-white shadow-lg shadow-[#137fec]/20 transition-all ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">fact_check</span>
                  {!isCollapsed && <p className="text-sm font-medium whitespace-nowrap">Compliance</p>}
                </button>

                {/* Agentic AI */}
                <button 
                  onClick={() => navigate('/agent')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c252e] transition-colors group ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}
                >
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] relative">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-[1600px] w-full mx-auto">
                {/* Breadcrumbs & Heading Area */}
                <div className="flex flex-col gap-6 mb-6">
                    {/* Breadcrumbs */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <button onClick={() => navigate('/dashboard')} className="text-slate-500 dark:text-[#92adc9] hover:text-[#137fec] text-sm font-medium leading-normal">Dashboard</button>
                        <span className="material-symbols-outlined text-slate-400 dark:text-[#92adc9] text-base">chevron_right</span>
                        <a className="text-slate-500 dark:text-[#92adc9] hover:text-[#137fec] text-sm font-medium leading-normal" href="#">Line 4: Body Shop</a>
                        <span className="material-symbols-outlined text-slate-400 dark:text-[#92adc9] text-base">chevron_right</span>
                        <span className="text-slate-900 dark:text-white text-sm font-medium leading-normal">Compliance Checks</span>
                    </div>
                    
                    {/* Header & Stats Row */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Operational Compliance Checks</h1>
                            <p className="text-slate-500 dark:text-[#92adc9] text-base font-normal leading-normal max-w-2xl">
                                Identify and resolve conflicts between maintenance policies, safety rules, and workforce certifications.
                            </p>
                        </div>
                        {/* Quick Stats */}
                        <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                            <div className="flex min-w-[140px] flex-col gap-1 rounded-lg px-4 py-3 bg-white dark:bg-[#233648] border border-slate-200 dark:border-[#324d67]/50 shadow-sm">
                                <span className="text-slate-500 dark:text-[#92adc9] text-xs font-medium uppercase tracking-wider">Active Conflicts</span>
                                <div className="flex items-end gap-2">
                                    <span className="text-slate-900 dark:text-white text-2xl font-bold leading-none">12</span>
                                    <span className="text-red-500 text-xs font-medium flex items-center"><span className="material-symbols-outlined text-xs mr-0.5">arrow_upward</span>2</span>
                                </div>
                            </div>
                            <div className="flex min-w-[140px] flex-col gap-1 rounded-lg px-4 py-3 bg-white dark:bg-[#233648] border border-slate-200 dark:border-[#324d67]/50 shadow-sm">
                                <span className="text-slate-500 dark:text-[#92adc9] text-xs font-medium uppercase tracking-wider">Critical Risks</span>
                                <div className="flex items-end gap-2">
                                    <span className="text-slate-900 dark:text-white text-2xl font-bold leading-none">3</span>
                                    <span className="text-orange-500 text-xs font-medium flex items-center"><span className="material-symbols-outlined text-xs mr-0.5">remove</span>0</span>
                                </div>
                            </div>
                            <div className="flex min-w-[140px] flex-col gap-1 rounded-lg px-4 py-3 bg-white dark:bg-[#233648] border border-slate-200 dark:border-[#324d67]/50 shadow-sm">
                                <span className="text-slate-500 dark:text-[#92adc9] text-xs font-medium uppercase tracking-wider">System Health</span>
                                <div className="flex items-end gap-2">
                                    <span className="text-slate-900 dark:text-white text-2xl font-bold leading-none">98%</span>
                                    <span className="text-[#0bda5b] text-xs font-medium flex items-center"><span className="material-symbols-outlined text-xs mr-0.5">check_circle</span>OK</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Master-Detail View */}
                <div className="flex flex-col lg:flex-row flex-1 gap-6 min-h-0 overflow-hidden pb-4">
                    
                    {/* Left Column: Conflict List (Master) */}
                    <div className="flex flex-col lg:w-1/3 min-w-[320px] bg-white dark:bg-[#111a22] border border-slate-200 dark:border-[#233648] rounded-xl overflow-hidden flex-shrink-0">
                        {/* List Header / Filters */}
                        <div className="p-4 border-b border-slate-200 dark:border-[#233648] bg-slate-50 dark:bg-[#1a2632]">
                            <div className="flex gap-2 mb-3">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 dark:text-[#92adc9] text-lg">search</span>
                                    <input className="w-full bg-white dark:bg-[#111a22] text-slate-900 dark:text-white text-sm rounded-lg border border-slate-200 dark:border-[#324d67] pl-9 pr-3 py-2 focus:ring-1 focus:ring-[#137fec] focus:border-[#137fec] outline-none placeholder-slate-400 dark:placeholder-[#5b6f84]" placeholder="Filter conflicts..." type="text"/>
                                </div>
                                <button className="flex items-center justify-center size-9 bg-white dark:bg-[#233648] hover:bg-slate-100 dark:hover:bg-[#324d67] rounded-lg border border-slate-200 dark:border-[#324d67] text-slate-500 dark:text-[#92adc9] transition-colors">
                                    <span className="material-symbols-outlined">filter_list</span>
                                </button>
                            </div>
                            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                                <button className="px-3 py-1 rounded-full bg-[#137fec]/20 text-[#137fec] border border-[#137fec]/30 text-xs font-medium whitespace-nowrap">All (12)</button>
                                <button className="px-3 py-1 rounded-full bg-white dark:bg-[#233648] text-slate-600 dark:text-[#92adc9] border border-slate-200 dark:border-[#324d67] hover:bg-slate-50 dark:hover:bg-[#324d67] text-xs font-medium whitespace-nowrap">Critical (3)</button>
                                <button className="px-3 py-1 rounded-full bg-white dark:bg-[#233648] text-slate-600 dark:text-[#92adc9] border border-slate-200 dark:border-[#324d67] hover:bg-slate-50 dark:hover:bg-[#324d67] text-xs font-medium whitespace-nowrap">Certification (5)</button>
                                <button className="px-3 py-1 rounded-full bg-white dark:bg-[#233648] text-slate-600 dark:text-[#92adc9] border border-slate-200 dark:border-[#324d67] hover:bg-slate-50 dark:hover:bg-[#324d67] text-xs font-medium whitespace-nowrap">Schedule (4)</button>
                            </div>
                        </div>
                        {/* Scrollable List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {/* Card 1: Active */}
                            <div className="cursor-pointer bg-blue-50 dark:bg-[#1a2733] border-l-4 border-l-red-500 rounded-r-lg p-4 hover:bg-blue-100 dark:hover:bg-[#233648] transition-colors group relative">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="inline-flex items-center gap-1.5 rounded bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-500/20">
                                        <span className="size-1.5 rounded-full bg-red-500"></span> Critical
                                    </span>
                                    <span className="text-slate-500 dark:text-[#5b6f84] text-xs">10:42 AM</span>
                                </div>
                                <h3 className="text-slate-900 dark:text-white text-sm font-bold mb-1 group-hover:text-[#137fec] transition-colors">Technician Certification Mismatch</h3>
                                <div className="flex items-center gap-2 text-slate-500 dark:text-[#92adc9] text-xs mb-3">
                                    <span className="material-symbols-outlined text-[16px]">precision_manufacturing</span>
                                    <span>Robotic Welder Kuka-200</span>
                                </div>
                                <div className="flex items-center justify-between text-xs border-t border-slate-200 dark:border-[#324d67] pt-2 mt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-center bg-cover rounded-full size-5 bg-slate-300" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAfXHoNrVDKt6js_ZjWDA9z0-0Eme21nabtb_lTMA7L5-7KBHGDiXsIYo5LRi7uhrkKj7GX8fDJFiYMuK6r0O06g5wYkx0aFcM3pcIw787-NnWCVvh2h7BHu7qYCwXdPFHFWq0vZS5Z4OthPWvtGmsktZUG5ncUlGwgEgWEc0Lf2aV7wZFGljtwJ3zd7_GN7vf2m4lpAA2sJH2jY2F-DfLRxs8gjJnEG6tw9X9BTFpyujapBjbO-4hHfpW24cmFzPDBHSdiMvOpRRU0')"}}></div>
                                        <span className="text-slate-700 dark:text-white">J. Doe</span>
                                    </div>
                                    <span className="text-red-500 dark:text-red-400 font-medium">Blocked</span>
                                </div>
                            </div>
                            {/* Card 2 */}
                            <div className="cursor-pointer bg-white dark:bg-[#111a22] border border-slate-200 dark:border-[#233648] rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-[#1a2733] transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="inline-flex items-center gap-1.5 rounded bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400 border border-orange-500/20">
                                        <span className="size-1.5 rounded-full bg-orange-500"></span> High Risk
                                    </span>
                                    <span className="text-slate-500 dark:text-[#5b6f84] text-xs">09:15 AM</span>
                                </div>
                                <h3 className="text-slate-900 dark:text-white text-sm font-semibold mb-1">Preventive Maintenance Overdue</h3>
                                <div className="flex items-center gap-2 text-slate-500 dark:text-[#92adc9] text-xs mb-3">
                                    <span className="material-symbols-outlined text-[16px]">conveyor_belt</span>
                                    <span>Paint Line Conveyor B2</span>
                                </div>
                                <div className="flex items-center justify-between text-xs border-t border-slate-200 dark:border-[#233648] pt-2 mt-2">
                                    <span className="text-slate-500 dark:text-[#5b6f84]">System Alert</span>
                                    <span className="text-orange-500 dark:text-orange-400">Warning</span>
                                </div>
                            </div>
                            {/* Card 3 */}
                            <div className="cursor-pointer bg-white dark:bg-[#111a22] border border-slate-200 dark:border-[#233648] rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-[#1a2733] transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="inline-flex items-center gap-1.5 rounded bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                        <span className="size-1.5 rounded-full bg-blue-500"></span> Policy
                                    </span>
                                    <span className="text-slate-500 dark:text-[#5b6f84] text-xs">08:30 AM</span>
                                </div>
                                <h3 className="text-slate-900 dark:text-white text-sm font-semibold mb-1">Shift Overlap Violation</h3>
                                <div className="flex items-center gap-2 text-slate-500 dark:text-[#92adc9] text-xs mb-3">
                                    <span className="material-symbols-outlined text-[16px]">groups</span>
                                    <span>Team Alpha</span>
                                </div>
                                <div className="flex items-center justify-between text-xs border-t border-slate-200 dark:border-[#233648] pt-2 mt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-center bg-cover rounded-full size-5 bg-slate-300" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDOKEoMgdyvM3Tz6nH_GDIxADAWRtDbfD7Ld1oZHnyhTev96ximkdODkHqx9E4b5BidS8pJ4yaThxQmcb8isy1YZ-I4Y65EokWZA3v48e1joYifV65ZOlQ0GmfkUQl1gCDTYt5q6XEgaQyGsf91ND39o0co1OudpcpBJZsAO8PObDshLBE6Dfyk2p_4WxNdJiOs8rYPgl5A8LUfo4MXROLWVQg4Nar1HOaVgtG3h20xUaA1r0WQopU0WMM7zyBknUGz7YrvSbO8otWf')"}}></div>
                                        <span className="text-slate-700 dark:text-white">M. Rodriguez</span>
                                    </div>
                                    <span className="text-slate-500 dark:text-[#92adc9]">Reviewing</span>
                                </div>
                            </div>
                            {/* Card 4 */}
                            <div className="cursor-pointer bg-white dark:bg-[#111a22] border border-slate-200 dark:border-[#233648] rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-[#1a2733] transition-colors opacity-70">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="inline-flex items-center gap-1.5 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        <span className="size-1.5 rounded-full bg-emerald-500"></span> Resolved
                                    </span>
                                    <span className="text-slate-500 dark:text-[#5b6f84] text-xs">Yesterday</span>
                                </div>
                                <h3 className="text-slate-500 dark:text-[#92adc9] text-sm font-semibold mb-1 line-through">Tool Calibration Error</h3>
                                <div className="flex items-center gap-2 text-slate-400 dark:text-[#5b6f84] text-xs mb-3">
                                    <span className="material-symbols-outlined text-[16px]">build</span>
                                    <span>Torque Gun #492</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Detail Panel */}
                    <div className="flex flex-col lg:w-2/3 bg-white dark:bg-[#111a22] border border-slate-200 dark:border-[#233648] rounded-xl overflow-hidden relative">
                        {/* Detail Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-[#233648] bg-slate-50 dark:bg-[#1a2632]">
                            <div className="flex items-start gap-4">
                                <div className="bg-red-500/10 dark:bg-red-500/20 p-3 rounded-lg border border-red-500/20 dark:border-red-500/30 text-red-500">
                                    <span className="material-symbols-outlined text-2xl">gpp_maybe</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Technician Certification Mismatch</h2>
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500 text-white uppercase tracking-wide">Critical</span>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-[#92adc9]">
                                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-lg">tag</span> Ticket #9920</span>
                                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-lg">calendar_today</span> Oct 24, 10:42 AM</span>
                                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-lg">precision_manufacturing</span> Line 4 - Station 12</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="flex items-center justify-center size-8 rounded-full bg-white dark:bg-[#233648] text-slate-500 dark:text-[#92adc9] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#324d67] border border-slate-200 dark:border-transparent transition-colors" title="Copy ID">
                                    <span className="material-symbols-outlined text-lg">content_copy</span>
                                </button>
                                <button className="flex items-center justify-center size-8 rounded-full bg-white dark:bg-[#233648] text-slate-500 dark:text-[#92adc9] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#324d67] border border-slate-200 dark:border-transparent transition-colors" title="Share">
                                    <span className="material-symbols-outlined text-lg">share</span>
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Graph Visualization Area */}
                            <div className="relative w-full h-64 bg-slate-50 dark:bg-[#0d141c] border-b border-slate-200 dark:border-[#233648] overflow-hidden group">
                                {/* Abstract Grid Background */}
                                <div className="absolute inset-0 opacity-10" style={{backgroundImage: "radial-gradient(#324d67 1px, transparent 1px)", backgroundSize: "20px 20px"}}></div>
                                {/* Graph Container */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                        {/* Connection Lines */}
                                        <line stroke="#137fec" strokeWidth="2" x1="35%" x2="50%" y1="50%" y2="50%"></line>
                                        <line className="graph-line" stroke="#ef4444" strokeWidth="2" x1="50%" x2="65%" y1="50%" y2="50%"></line>
                                        <line stroke="#324d67" strokeDasharray="4" strokeWidth="1" x1="50%" x2="50%" y1="50%" y2="25%"></line>
                                    </svg>
                                    
                                    {/* Node: Machine */}
                                    <div className="absolute left-[35%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10">
                                        <div className="size-14 rounded-full bg-white dark:bg-[#1a2733] border-2 border-[#137fec] flex items-center justify-center shadow-[0_0_15px_rgba(19,127,236,0.3)]">
                                            <span className="material-symbols-outlined text-[#137fec] text-2xl">precision_manufacturing</span>
                                        </div>
                                        <span className="bg-white dark:bg-[#233648] px-2 py-0.5 rounded text-xs text-slate-700 dark:text-white font-medium border border-slate-200 dark:border-[#324d67]">Robotic Welder</span>
                                    </div>
                                    
                                    {/* Node: Policy */}
                                    <div className="absolute left-[50%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10">
                                        <div className="size-16 rounded-full bg-white dark:bg-[#1a2733] border-2 border-slate-900 dark:border-white flex items-center justify-center shadow-lg">
                                            <span className="material-symbols-outlined text-slate-900 dark:text-white text-3xl">policy</span>
                                        </div>
                                        <div className="bg-slate-900 dark:bg-white text-white dark:text-black px-2 py-0.5 rounded text-xs font-bold shadow-sm">Protocol 7B</div>
                                        <span className="text-slate-500 dark:text-[#92adc9] text-[10px] bg-white/80 dark:bg-[#111a22]/80 px-1 rounded">Req: L3 Cert</span>
                                    </div>
                                    
                                    {/* Node: Technician */}
                                    <div className="absolute left-[65%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10">
                                        <div className="relative size-14 rounded-full bg-white dark:bg-[#1a2733] border-2 border-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                            <div className="absolute -top-1 -right-1 size-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white dark:border-[#1a2733]">
                                                <span className="material-symbols-outlined text-white text-[12px]">close</span>
                                            </div>
                                            <span className="material-symbols-outlined text-red-500 text-2xl">engineering</span>
                                        </div>
                                        <span className="bg-white dark:bg-[#233648] px-2 py-0.5 rounded text-xs text-slate-700 dark:text-white font-medium border border-slate-200 dark:border-[#324d67]">Tech: J. Doe (L2)</span>
                                    </div>
                                    
                                    {/* Node: Supervisor */}
                                    <div className="absolute left-[50%] top-[25%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10 opacity-50">
                                        <div className="size-10 rounded-full bg-white dark:bg-[#1a2733] border border-slate-300 dark:border-[#324d67] flex items-center justify-center">
                                            <span className="material-symbols-outlined text-slate-400 dark:text-[#92adc9] text-lg">supervisor_account</span>
                                        </div>
                                        <span className="text-slate-500 dark:text-[#5b6f84] text-[10px]">Supervisor</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-8">
                                {/* Analysis Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h3 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#137fec] text-lg">analytics</span>
                                            Root Cause Analysis
                                        </h3>
                                        <div className="p-4 bg-slate-50 dark:bg-[#1a2632] rounded-lg border border-slate-200 dark:border-[#324d67] text-slate-600 dark:text-[#cddbea] text-sm leading-relaxed">
                                            The assigned technician <strong className="text-slate-900 dark:text-white">J. Doe (ID: 492)</strong> currently holds a <span className="text-orange-500 dark:text-orange-400">Level 2</span> Robotics Certification. Maintenance Protocol <strong className="text-slate-900 dark:text-white">7B</strong> for the Kuka-200 Welder strictly requires a <span className="text-[#137fec]">Level 3</span> certification due to high-voltage components access.
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                            <span className="material-symbols-outlined text-emerald-500 text-lg">recommend</span>
                                            AI Recommendation
                                        </h3>
                                        <div className="p-4 bg-slate-50 dark:bg-[#1a2632] rounded-lg border border-slate-200 dark:border-[#324d67] text-slate-600 dark:text-[#cddbea] text-sm leading-relaxed flex flex-col gap-3">
                                            <p>Reassign task to the nearest available Level 3 technician to maintain compliance and avoid schedule slippage.</p>
                                            <div className="flex items-center gap-3 p-2 bg-white dark:bg-[#111a22] rounded border border-slate-200 dark:border-[#233648]">
                                                <div className="bg-center bg-cover rounded-full size-8 bg-slate-300" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAaxBbetgV3otLmvjdGxdKlUL_RtgVJS1OcJTUBEb-fQnrEMqyZlfD1dB_ixgWr2s_pa00XBjkwRGjKjoRxnCPX46e27Kh7GO-LxpOZGPDH0H9Q0tFszY7HPSuI964mJAgWUJGNRH2Ne78tReuWl2X-r11KxYcop7fHsgW9erQWKW_GSURkKTzt9-6T3mhAI8Pn7j9YSP_ty8n8otCzlckfU53F2lfiCLDpKGUYmHAmE61jyosgOrEt-FKA-hUgWk83hL42OOb02bbH')"}}></div>
                                                <div className="flex flex-col">
                                                    <span className="text-slate-900 dark:text-white font-medium text-xs">S. Connor</span>
                                                    <span className="text-[#0bda5b] text-[10px]">Available • L3 Certified</span>
                                                </div>
                                                <button className="ml-auto text-[#137fec] text-xs font-bold hover:underline">View Schedule</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-[#233648]">
                                    <h3 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider">Resolution Actions</h3>
                                    <div className="flex flex-wrap gap-4">
                                        <button className="flex items-center gap-2 px-6 py-3 bg-[#137fec] hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-900/20">
                                            <span className="material-symbols-outlined">person_add</span>
                                            Reassign to S. Connor
                                        </button>
                                        <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#233648] hover:bg-slate-50 dark:hover:bg-[#324d67] text-slate-700 dark:text-white font-medium rounded-lg border border-slate-200 dark:border-[#324d67] transition-colors">
                                            <span className="material-symbols-outlined text-orange-500 dark:text-orange-400">lock_open</span>
                                            Request Supervisor Override
                                        </button>
                                        <button className="flex items-center gap-2 px-6 py-3 bg-transparent hover:bg-slate-100 dark:hover:bg-[#233648] text-slate-500 dark:text-[#92adc9] font-medium rounded-lg transition-colors ml-auto">
                                            Dismiss Alert
                                        </button>
                                    </div>
                                </div>

                                {/* History Log */}
                                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-[#233648]">
                                    <h3 className="text-slate-500 dark:text-[#92adc9] text-xs font-bold uppercase tracking-wider">Activity Log</h3>
                                    <div className="space-y-4 relative pl-2">
                                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200 dark:bg-[#324d67]"></div>
                                        <div className="relative pl-6 flex flex-col gap-1">
                                            <div className="absolute left-0 top-1.5 size-3.5 bg-white dark:bg-[#111a22] border-2 border-red-500 rounded-full"></div>
                                            <span className="text-slate-900 dark:text-white text-sm">Conflict Detected: Certification Mismatch</span>
                                            <span className="text-slate-500 dark:text-[#5b6f84] text-xs">Today, 10:42 AM • By System Watchdog</span>
                                        </div>
                                        <div className="relative pl-6 flex flex-col gap-1">
                                            <div className="absolute left-0 top-1.5 size-3.5 bg-white dark:bg-[#111a22] border-2 border-slate-400 dark:border-[#324d67] rounded-full"></div>
                                            <span className="text-[#92adc9] text-sm">Task Scheduled: Welding Arm Maintenance</span>
                                            <span className="text-[#5b6f84] text-xs">Today, 08:00 AM • Auto-Scheduler</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
};

export default CompliancePage;