import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CompliancePage = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // --- STATE FOR DYNAMIC ALERTS ---
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // 1. Fetch Alerts on Mount and Interval
  const fetchAlerts = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/compliance/alerts');
      const data = await res.json();
      setAlerts(data);
      if (!selectedAlert && data.length > 0) setSelectedAlert(data[0]);
    } catch (e) {
      console.error("Failed to fetch alerts");
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Poll every 5 seconds for new agent updates
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => navigate('/');

  // 2. TRIGGER SIMULATION ACTION
  const handleSimulateLog = async () => {
    setIsSimulating(true);
    try {
        const res = await fetch('http://localhost:8000/api/simulation/log', { method: 'POST' });
        if(res.ok) {
            await fetchAlerts(); // Refresh immediately
            // Optionally auto-select the new one
        }
    } catch (e) {
        console.error("Simulation failed", e);
    } finally {
        setIsSimulating(false);
    }
  };

  const handleResolve = async (id) => {
      try {
        await fetch(`http://localhost:8000/api/compliance/resolve/${id}`, { method: 'POST' });
        fetchAlerts();
      } catch(e) { console.error(e); }
  };

  return (
    <div className="min-h-screen font-['Inter',sans-serif] antialiased overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] text-slate-900 dark:text-white flex flex-row">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Noto+Sans:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .dark ::-webkit-scrollbar { width: 8px; height: 8px; }
        .dark ::-webkit-scrollbar-track { background: #101922; }
        .dark ::-webkit-scrollbar-thumb { background: #283039; border-radius: 4px; }
      `}</style>

      {/* --- SIDEBAR (Standard) --- */}
      <div 
        className={`hidden md:flex flex-col border-r border-slate-200 dark:border-[#283039] bg-white dark:bg-[#111418] flex-shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'}`}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <div className="flex flex-col h-full p-4 justify-between">
           <div className="flex flex-col gap-8">
             <div className="flex items-center justify-center text-[#137fec]">
                <span className="material-symbols-outlined text-[32px]">precision_manufacturing</span>
             </div>
             <div className="flex flex-col gap-2">
               <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c252e]"><span className="material-symbols-outlined text-[20px]">dns</span>{!isCollapsed && "Data Sources"}</button>
               <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#137fec] text-white"><span className="material-symbols-outlined text-[20px]">fact_check</span>{!isCollapsed && "Compliance"}</button>
               <button onClick={() => navigate('/agent')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c252e]"><span className="material-symbols-outlined text-[20px]">smart_toy</span>{!isCollapsed && "Agents"}</button>
             </div>
           </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] relative">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-[1600px] w-full mx-auto">
                
                {/* Header & Simulation Trigger */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black font-['Space_Grotesk',sans-serif]">Operational Compliance</h1>
                        <p className="text-slate-500 dark:text-[#92adc9]">Real-time Agentic Analysis of Machinery Logs.</p>
                    </div>
                    
                    {/* SIMULATE BUTTON */}
                    <button 
                        onClick={handleSimulateLog}
                        disabled={isSimulating}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold shadow-lg transition-all ${isSimulating ? 'bg-slate-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'}`}
                    >
                        {isSimulating ? (
                            <span className="material-symbols-outlined animate-spin">refresh</span>
                        ) : (
                            <span className="material-symbols-outlined">warning</span>
                        )}
                        {isSimulating ? "Running Agent..." : "Simulate Critical Fault"}
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row flex-1 gap-6 min-h-[600px]">
                    
                    {/* LEFT: Alert List */}
                    <div className="flex flex-col lg:w-1/3 min-w-[320px] bg-white dark:bg-[#111a22] border border-slate-200 dark:border-[#233648] rounded-xl overflow-hidden flex-shrink-0">
                        <div className="p-4 border-b border-slate-200 dark:border-[#233648] bg-slate-50 dark:bg-[#1a2632]">
                            <h3 className="font-bold text-slate-700 dark:text-white">Live Alerts ({alerts.length})</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {alerts.map((alert) => (
                                <div 
                                    key={alert.id}
                                    onClick={() => setSelectedAlert(alert)}
                                    className={`cursor-pointer border border-transparent rounded-lg p-4 transition-colors relative group ${selectedAlert?.id === alert.id ? 'bg-blue-50 dark:bg-[#1a2733] border-blue-200 dark:border-[#324d67]' : 'bg-white dark:bg-[#111a22] hover:bg-slate-50 dark:hover:bg-[#1a2733]'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium border ${alert.severity === 'Critical' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                            <span className={`size-1.5 rounded-full ${alert.severity === 'Critical' ? 'bg-red-500' : 'bg-emerald-500'}`}></span> 
                                            {alert.severity}
                                        </span>
                                        <span className="text-slate-400 text-xs">{alert.timestamp}</span>
                                    </div>
                                    <h3 className="text-slate-900 dark:text-white text-sm font-bold mb-1">{alert.title}</h3>
                                    <p className="text-xs text-slate-500">{alert.machine}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Detail View */}
                    <div className="flex flex-col lg:w-2/3 bg-white dark:bg-[#111a22] border border-slate-200 dark:border-[#233648] rounded-xl overflow-hidden relative">
                        {selectedAlert ? (
                            <>
                                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-[#233648] bg-slate-50 dark:bg-[#1a2632]">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg border text-white ${selectedAlert.severity === 'Critical' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                                            <span className="material-symbols-outlined text-2xl">
                                                {selectedAlert.severity === 'Critical' ? 'gpp_maybe' : 'check_circle'}
                                            </span>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedAlert.title}</h2>
                                            <p className="text-sm text-slate-500">ID: {selectedAlert.id} • {selectedAlert.machine}</p>
                                        </div>
                                    </div>
                                    {selectedAlert.status !== 'Resolved' && (
                                        <button 
                                            onClick={() => handleResolve(selectedAlert.id)}
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
                                        >
                                            Resolve Alert
                                        </button>
                                    )}
                                </div>

                                <div className="p-6 space-y-8 overflow-y-auto">
                                    {/* Agent Analysis */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg">analytics</span> Analysis
                                            </h3>
                                            <div className="p-4 bg-slate-50 dark:bg-[#1a2632] rounded-lg border border-slate-200 dark:border-[#324d67] text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                                {selectedAlert.description}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg text-[#137fec]">smart_toy</span> AI Recommendation
                                            </h3>
                                            <div className="p-4 bg-slate-50 dark:bg-[#1a2632] rounded-lg border border-slate-200 dark:border-[#324d67] text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                                {selectedAlert.recommendation}
                                            </div>
                                            {selectedAlert.technician && (
                                                <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#111a22] rounded border border-slate-200 dark:border-[#233648]">
                                                    <div className="size-8 rounded-full bg-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
                                                        {selectedAlert.technician.substring(0,2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedAlert.technician}</p>
                                                        <p className="text-xs text-emerald-500">Assigned by Agent</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <span className="material-symbols-outlined text-4xl mb-2">notifications_off</span>
                                <p>Select an alert to view details</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </main>
      </div>
    </div>
  );
};

export default CompliancePage;