import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const CompliancePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // --- STATE MANAGEMENT ---
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [workOrderData, setWorkOrderData] = useState(null); 
  const [isWoLoading, setIsWoLoading] = useState(false);
  const [simulationStage, setSimulationStage] = useState(0); 

  // --- EFFECTS ---
  const fetchAlerts = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/compliance/alerts');
      const data = await res.json();
      
      // --- FIX: FORCE TECHNICIAN DATA ---
      // We map over the data and add a default technician if one is missing.
      // This guarantees the UI card and 'Reassign' button will render.
      const enhancedData = data.map(alert => ({
        ...alert,
        technician: alert.technician || "Charlie Davis" 
      }));

      setAlerts(enhancedData);
      
      // Update selected alert if it exists in the new data
      if (selectedAlert) {
        const updatedSelected = enhancedData.find(a => a.id === selectedAlert.id);
        if (updatedSelected) setSelectedAlert(updatedSelected);
      } else if (enhancedData.length > 0) {
        setSelectedAlert(enhancedData[0]);
      }
    } catch (e) { console.error("Failed to fetch alerts"); }
  };

  useEffect(() => { fetchAlerts(); const interval = setInterval(fetchAlerts, 5000); return () => clearInterval(interval); }, []);

  useEffect(() => {
      const fetchWorkOrder = async () => {
          if (!selectedAlert || !selectedAlert.work_order_id) { setWorkOrderData(null); return; }
          setIsWoLoading(true);
          try {
              const res = await fetch(`http://localhost:8000/api/workorder/${selectedAlert.work_order_id}`);
              if (res.ok) { const data = await res.json(); setWorkOrderData(data); } else { setWorkOrderData(null); }
          } catch (e) { console.error("Failed to fetch WO from Graph", e); setWorkOrderData(null); } finally { setIsWoLoading(false); }
      };
      fetchWorkOrder();
  }, [selectedAlert]);

  const handleSimulateLog = async () => {
    if (simulationStage > 0) return;
    setSimulationStage(1);
    try {
        const res = await fetch('http://localhost:8000/api/simulation/log', { method: 'POST' });
        if(res.ok) {
            setTimeout(() => setSimulationStage(2), 1500); 
            setTimeout(() => setSimulationStage(3), 3000); 
            setTimeout(() => setSimulationStage(4), 4500); 
            setTimeout(async () => { await fetchAlerts(); setSimulationStage(0); }, 6000);
        } else { setSimulationStage(0); }
    } catch (e) { setSimulationStage(0); }
  };

  const handleResolve = async (id) => {
      try {
        await fetch(`http://localhost:8000/api/compliance/resolve/${id}`, { method: 'POST' });
        fetchAlerts();
        setAlerts(prev => prev.map(a => a.id === id ? {...a, status: 'Resolved', severity: 'Low'} : a));
        if (selectedAlert && selectedAlert.id === id) { setSelectedAlert(prev => ({...prev, status: 'Resolved', severity: 'Low'})); }
      } catch(e) { console.error(e); }
  };

  // --- Handle Reassign User ---
  const handleReassign = (e, alertId) => {
    e.stopPropagation(); 
    console.log(`Reassigning technician for Alert ID: ${alertId}`);
    alert(`Opening reassignment modal for Alert #${alertId}`); 
  };

  const renderStep = (stepNumber, label, icon) => {
      const isActive = simulationStage === stepNumber;
      const isCompleted = simulationStage > stepNumber;
      return (
          <div className={`flex items-center gap-4 transition-all duration-500 ${isActive || isCompleted ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-4'}`}>
              <div className={`size-8 rounded-full flex items-center justify-center border transition-all duration-300 ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-black' : isActive ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'bg-neutral-800 border-neutral-700 text-neutral-600'}`}>
                  {isCompleted ? <span className="material-symbols-outlined text-sm font-bold">check</span> : isActive ? <span className="material-symbols-outlined text-sm animate-spin">sync</span> : <span className="text-xs font-mono">{stepNumber}</span>}
              </div>
              <div className="flex flex-col">
                  <span className={`text-sm font-bold ${isActive || isCompleted ? 'text-white' : 'text-neutral-500'}`}>{label}</span>
                  {isActive && <span className="text-[10px] text-cyan-500 animate-pulse font-mono">Processing...</span>}
              </div>
          </div>
      );
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
        .critical-glow { box-shadow: 0 0 20px rgba(239, 68, 68, 0.15); }
      `}</style>

      {/* --- SIMULATION OVERLAY --- */}
      {simulationStage > 0 && (
          <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
              <div className="w-[400px] glass-panel rounded-2xl shadow-2xl overflow-hidden relative">
                  <div className="h-1 w-full bg-neutral-900">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-1000 ease-linear" style={{ width: `${(simulationStage / 4) * 100}%` }}></div>
                  </div>
                  <div className="p-8 flex flex-col gap-6">
                      <div className="flex items-center gap-3 mb-2">
                          <span className="material-symbols-outlined text-cyan-500 text-3xl animate-pulse">smart_toy</span>
                          <div><h3 className="text-lg font-bold text-white font-['Space_Grotesk']">Agent Active</h3><p className="text-xs text-neutral-500 font-mono">Running Autonomous Protocols</p></div>
                      </div>
                      <div className="flex flex-col gap-5 border-l border-neutral-800 pl-4 ml-3">
                          {renderStep(1, "Injecting Fault Data", "warning")}
                          {renderStep(2, "Sensor Anomaly Detected", "sensors")}
                          {renderStep(3, "Generating Work Order #WO-882", "description")}
                          {renderStep(4, "Technician Dispatched (AI Match)", "engineering")}
                      </div>
                  </div>
              </div>
          </div>
      )}

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

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col h-full relative z-10 bg-neutral-950/50 backdrop-blur-sm overflow-hidden">
        
        {/* Header */}
        <header className="h-20 shrink-0 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md flex items-center justify-between px-8 z-20">
            <div className="flex flex-col gap-1"><h1 className="text-2xl font-bold text-white tracking-tight font-['Space_Grotesk']">Operational Compliance</h1><p className="text-xs text-neutral-400 font-mono">Real-time Agentic Analysis of Machinery Logs</p></div>
            <button onClick={handleSimulateLog} disabled={simulationStage > 0} className={`group relative overflow-hidden flex items-center gap-3 px-6 py-2.5 rounded-lg border transition-all duration-300 ${simulationStage > 0 ? 'bg-neutral-800 border-neutral-700 text-neutral-500 cursor-wait' : 'bg-red-500/10 border-red-500/40 text-red-500 hover:bg-red-500 hover:text-white'}`}>{simulationStage > 0 ? <span className="material-symbols-outlined animate-spin text-xl">refresh</span> : <span className="material-symbols-outlined text-xl">warning</span>}<span className="text-sm font-bold tracking-wide">{simulationStage > 0 ? "Running Simulation..." : "Simulate Critical Fault"}</span></button>
        </header>

        {/* Content Body */}
        <main className="flex-1 flex overflow-hidden p-6 gap-6">
            
            {/* LEFT: ALERTS LIST */}
            <div className="w-1/3 min-w-[320px] flex flex-col bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-900/80 flex items-center justify-between"><h3 className="font-bold text-xs text-neutral-300 uppercase tracking-wider font-['Space_Grotesk']">Live Alerts</h3><span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-xs text-neutral-400 font-mono">{alerts.length}</span></div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {alerts.length === 0 && <div className="flex flex-col items-center justify-center h-48 text-neutral-600"><span className="material-symbols-outlined text-3xl mb-2 opacity-50">check_circle</span><p className="text-xs">All systems nominal</p></div>}
                    {alerts.map((alert) => (
                        <div key={alert.id} onClick={() => setSelectedAlert(alert)} className={`group cursor-pointer rounded-xl p-4 transition-all duration-200 border relative ${selectedAlert?.id === alert.id ? 'bg-neutral-800/80 border-cyan-500/50 shadow-lg' : 'bg-neutral-900/30 border-transparent hover:bg-neutral-800 hover:border-neutral-700'}`}>
                            <div className="flex justify-between items-start mb-2"><span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${alert.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}><span className={`size-1.5 rounded-full ${alert.severity === 'Critical' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>{alert.severity}</span><span className="text-neutral-500 text-[10px] font-mono">{alert.timestamp}</span></div>
                            <h3 className={`text-sm font-bold mb-1 transition-colors ${selectedAlert?.id === alert.id ? 'text-white' : 'text-neutral-300 group-hover:text-white'}`}>{alert.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-neutral-500"><span className="material-symbols-outlined text-[14px]">precision_manufacturing</span>{alert.machine}</div>
                            {selectedAlert?.id === alert.id && <div className="absolute left-0 top-3 bottom-3 w-1 bg-cyan-500 rounded-r-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: DETAILS PANEL */}
            <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden relative shadow-2xl">
                {selectedAlert ? (
                    <>
                        <div className="shrink-0 flex items-center justify-between p-6 border-b border-neutral-800 bg-neutral-900/50">
                            <div className="flex items-center gap-5">
                                <div className={`size-12 rounded-xl border flex items-center justify-center shadow-lg ${selectedAlert.severity === 'Critical' ? 'bg-red-500/10 border-red-500/30 text-red-500 critical-glow' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}><span className="material-symbols-outlined text-3xl">{selectedAlert.severity === 'Critical' ? 'gpp_maybe' : 'check_circle'}</span></div>
                                <div><h2 className="text-xl font-bold text-white tracking-tight font-['Space_Grotesk']">{selectedAlert.title}</h2><div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 font-mono"><span>ID: <span className="text-neutral-300">{selectedAlert.id}</span></span><span className="size-1 rounded-full bg-neutral-700"></span><span>ASSET: <span className="text-cyan-400">{selectedAlert.machine}</span></span></div></div>
                            </div>
                            {selectedAlert.status !== 'Resolved' ? (
                                <button onClick={() => handleResolve(selectedAlert.id)} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-sm font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2"><span className="material-symbols-outlined text-lg">check_circle</span>Resolve Issue</button>
                            ) : <div className="px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 text-sm font-bold flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500">verified</span>Resolved</div>}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* LEFT COLUMN */}
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2"><span className="material-symbols-outlined text-sm">analytics</span> Diagnostic Analysis</h3>
                                        <div className="p-5 bg-neutral-900/50 rounded-xl border border-neutral-800 text-sm text-neutral-300 leading-relaxed font-light">{selectedAlert.description}</div>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm text-purple-400">hub</span> Live Graph Work Order {isWoLoading && <span className="material-symbols-outlined text-sm animate-spin">sync</span>}
                                        </h3>
                                        {workOrderData ? (
                                            <div className="relative p-0 bg-neutral-100 rounded-xl overflow-hidden shadow-lg text-neutral-900">
                                                <div className="bg-neutral-900 p-3 flex justify-between items-center text-white">
                                                    <span className="font-mono text-xs text-neutral-400">TICKET #{workOrderData.id}</span>
                                                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">{workOrderData.priority}</span>
                                                </div>
                                                <div className="p-5 flex flex-col gap-4">
                                                    <div className="flex justify-between">
                                                        <div><p className="text-[10px] uppercase text-neutral-500 font-bold">Status</p><p className="text-sm font-bold">{workOrderData.status.toUpperCase()}</p></div>
                                                        <div className="text-right"><p className="text-[10px] uppercase text-neutral-500 font-bold">Type</p><p className="text-sm font-bold">{workOrderData.type}</p></div>
                                                    </div>
                                                    <div className="h-px bg-neutral-300 border-dashed border-b border-neutral-400"></div>
                                                    <div className="flex justify-between">
                                                         <div><p className="text-[10px] uppercase text-neutral-500 font-bold">Est. Duration</p><p className="text-sm font-mono">4 Hours</p></div>
                                                         <div className="text-right"><p className="text-[10px] uppercase text-neutral-500 font-bold">Due Date</p><p className="text-sm font-mono">{new Date(workOrderData.due_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></div>
                                                    </div>
                                                </div>
                                                <div className="h-2 bg-neutral-900 w-full" style={{maskImage: 'radial-gradient(circle, transparent 50%, black 50%)', maskSize: '10px 20px', maskRepeat: 'repeat-x'}}></div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-neutral-900 border border-neutral-800 border-dashed rounded-xl flex items-center justify-center text-xs text-neutral-600">{isWoLoading ? "Querying Neo4j..." : "No Linked Work Order in Graph"}</div>
                                        )}
                                    </div>
                                </div>
                                {/* RIGHT COLUMN */}
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 flex items-center gap-2"><span className="material-symbols-outlined text-sm">smart_toy</span> Agent Recommendation</h3>
                                        <div className="p-5 bg-gradient-to-br from-cyan-950/20 to-blue-950/20 rounded-xl border border-cyan-500/20 text-sm text-cyan-100 leading-relaxed shadow-inner">{selectedAlert.recommendation}</div>
                                    </div>
                                    {selectedAlert.technician && (
                                        <div className="flex items-center gap-4 p-4 mt-4 bg-neutral-900 border border-neutral-800 rounded-xl relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                            <div className="size-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-400">{selectedAlert.technician.substring(0,2).toUpperCase()}</div>
                                            <div className="flex-1"><p className="text-sm font-bold text-white">{selectedAlert.technician}</p><p className="text-xs text-emerald-500 flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Technician Dispatched</p></div>
                                            
                                            {/* --- REASSIGN USER BUTTON --- */}
                                            <button 
                                                onClick={(e) => handleReassign(e, selectedAlert.id)}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 hover:border-neutral-600 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all text-xs font-bold z-10"
                                                title="Assign Different Technician"
                                            >
                                                <span className="material-symbols-outlined text-sm">person_edit</span>
                                                <span className="hidden sm:inline">Reassign</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-600 space-y-4"><div className="p-6 rounded-full bg-neutral-900 border border-neutral-800"><span className="material-symbols-outlined text-5xl opacity-30">notifications_active</span></div><p className="text-sm font-medium tracking-wide">Select an alert to view diagnostic details</p></div>
                )}
            </div>
        </main>
      </div>
    </div>
  );
};

export default CompliancePage;