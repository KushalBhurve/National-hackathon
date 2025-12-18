import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ResourceManagementPage = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState('technicians'); // 'technicians' | 'tasks'

  // --- FORM STATES ---
  const [techForm, setTechForm] = useState({
    name: '',
    role: 'Maintenance Tech',
    certification_level: 'L1',
    status: 'Active'
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    target_machine: '',
    required_certification: 'L1',
    priority: 'Medium'
  });

  const [status, setStatus] = useState(null); // { type: 'success' | 'error', msg: '' }
  const [isLoading, setIsLoading] = useState(false);
  const [machines, setMachines] = useState([]); 

  // Fetch machines for the dropdown on mount
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/agent/filters');
        const data = await res.json();
        setMachines(data.machinery || []);
        if(data.machinery.length > 0) {
            setTaskForm(prev => ({...prev, target_machine: data.machinery[0]}));
        }
      } catch (e) {
        console.error("Failed to fetch machines");
      }
    };
    fetchMachines();
  }, []);

  const handleLogout = () => navigate('/');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    const endpoint = activeTab === 'technicians' 
      ? 'http://localhost:8000/api/resources/technician'
      : 'http://localhost:8000/api/resources/task';
    
    const body = activeTab === 'technicians' ? techForm : taskForm;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to create resource');

      setStatus({ type: 'success', msg: `${activeTab === 'technicians' ? 'Technician' : 'Task'} added to Knowledge Graph successfully.` });
      
      // Reset logic
      if (activeTab === 'tasks') setTaskForm(prev => ({ ...prev, title: '', description: '' }));
      else setTechForm(prev => ({ ...prev, name: '' }));

    } catch (error) {
      setStatus({ type: 'error', msg: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-neutral-950 text-neutral-200 font-sans overflow-hidden selection:bg-cyan-500/30">
       <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        :root { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #262626; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #404040; }
        .glass-panel { background: rgba(23, 23, 23, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .input-base { width: 100%; background: rgba(0,0,0,0.4); border: 1px solid #262626; color: white; padding: 12px 16px; border-radius: 12px; font-size: 14px; outline: none; transition: all 0.2s; }
        .input-base:focus { border-color: rgba(34, 211, 238, 0.5); box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.2); }
        .input-base:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* --- SIDEBAR --- */}
      <div className={`relative z-50 flex flex-col border-r border-neutral-800 bg-neutral-900/90 backdrop-blur-xl transition-all duration-500 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'}`}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <div className="flex flex-col h-full p-4 justify-between">
          <div className="flex flex-col gap-8">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start px-2'}`}>
                <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                    <div className="relative flex items-center justify-center text-cyan-400">
                        <span className="material-symbols-outlined text-[32px]">precision_manufacturing</span>
                    </div>
                </div>
                {!isCollapsed && <h1 className="ml-3 text-xl font-bold tracking-tight text-white whitespace-nowrap">Factory<span className="text-cyan-400">OS</span></h1>}
            </div>
            
            <nav className="flex flex-col gap-2">
              <button onClick={() => navigate('/dashboard')} className={`group flex items-center gap-3 px-3 py-3 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-200 ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                  <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">dns</span>
                  {!isCollapsed && <span className="text-sm font-medium">Data Sources</span>}
              </button>
              
              <button className={`relative overflow-hidden flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 text-cyan-400 transition-all ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                <div className="absolute inset-0 bg-cyan-500/10 opacity-0 hover:opacity-100 transition-opacity"></div>
                <span className="material-symbols-outlined text-[20px] drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">group_add</span>
                {!isCollapsed && <span className="text-sm font-bold">Resources</span>}
              </button>

              <button onClick={() => navigate('/compliance')} className={`group flex items-center gap-3 px-3 py-3 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-200 ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                  <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">fact_check</span>
                  {!isCollapsed && <span className="text-sm font-medium">Compliance</span>}
              </button>

              <button onClick={() => navigate('/agent')} className={`group flex items-center gap-3 px-3 py-3 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-200 ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                  <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">smart_toy</span>
                  {!isCollapsed && <span className="text-sm font-medium">Agents</span>}
              </button>

              <button onClick={() => navigate('/system-flow')} className={`group flex items-center gap-3 px-3 py-3 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-200 ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                  <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">hub</span>
                  {!isCollapsed && <span className="text-sm font-medium">Architecture</span>}
              </button>
            </nav>
          </div>
          <div className="px-2 pb-2">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-3 rounded-xl bg-neutral-800/50 border border-white/5 transition-all hover:border-white/10`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neutral-600 to-neutral-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-black">AD</div>
              {!isCollapsed && (
                <>
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-sm font-semibold leading-none text-white truncate">Admin User</p>
                    <p className="text-xs text-neutral-500 mt-1 truncate">System Administrator</p>
                  </div>
                  <button onClick={handleLogout} className="ml-auto text-neutral-500 hover:text-red-400 transition-colors"><span className="material-symbols-outlined text-lg">logout</span></button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col h-full relative z-10 bg-neutral-950/50 backdrop-blur-sm overflow-hidden">
        
        {/* Header */}
        <header className="h-24 shrink-0 flex flex-col justify-center border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md px-8 z-20">
            <h1 className="text-3xl font-bold text-white tracking-tight font-['Inter',sans-serif]">Resource Management</h1>
            <p className="text-sm text-neutral-400 mt-1">Provision personnel and tasks directly into the Neo4j Knowledge Graph.</p>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">

                {/* TABS */}
                <div className="flex p-1 bg-neutral-900/80 rounded-xl border border-neutral-800 w-fit">
                    <button 
                        onClick={() => setActiveTab('technicians')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                            activeTab === 'technicians' 
                            ? 'bg-neutral-800 text-white shadow-lg shadow-black/50 border border-neutral-700' 
                            : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px] text-cyan-500">engineering</span>
                        Technicians
                    </button>
                    <button 
                        onClick={() => setActiveTab('tasks')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                            activeTab === 'tasks' 
                            ? 'bg-neutral-800 text-white shadow-lg shadow-black/50 border border-neutral-700' 
                            : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px] text-purple-500">assignment</span>
                        Operational Tasks
                    </button>
                </div>

                {/* FORM CARD */}
                <div className="glass-panel rounded-3xl p-1 relative overflow-hidden shadow-2xl">
                    {/* Decorative Top Line */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                    
                    <div className="bg-neutral-950/60 rounded-[22px] p-8">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                            
                            {/* --- TECHNICIAN FORM --- */}
                            {activeTab === 'technicians' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="col-span-1 md:col-span-2">
                                        <h3 className="text-lg font-bold text-white mb-1">Technician Details</h3>
                                        <p className="text-xs text-neutral-500">Register new personnel for automated task assignment.</p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">badge</span> Name
                                        </label>
                                        <input 
                                            required type="text" placeholder="e.g. John Doe"
                                            className="input-base"
                                            value={techForm.name}
                                            onChange={e => setTechForm({...techForm, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">work</span> Role
                                        </label>
                                        <input 
                                            required type="text" placeholder="e.g. Maintenance Engineer"
                                            className="input-base"
                                            value={techForm.role}
                                            onChange={e => setTechForm({...techForm, role: e.target.value})}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">verified</span> Certification
                                        </label>
                                        <div className="relative">
                                            <select 
                                                className="input-base appearance-none cursor-pointer"
                                                value={techForm.certification_level}
                                                onChange={e => setTechForm({...techForm, certification_level: e.target.value})}
                                            >
                                                <option value="L1">L1 (Basic)</option>
                                                <option value="L2">L2 (Intermediate)</option>
                                                <option value="L3">L3 (Advanced/High Voltage)</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500"><span className="material-symbols-outlined">expand_more</span></div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">toggle_on</span> Status
                                        </label>
                                        <div className="relative">
                                            <select 
                                                className="input-base appearance-none cursor-pointer"
                                                value={techForm.status}
                                                onChange={e => setTechForm({...techForm, status: e.target.value})}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="On Leave">On Leave</option>
                                                <option value="Busy">Busy</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500"><span className="material-symbols-outlined">expand_more</span></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- TASK FORM --- */}
                            {activeTab === 'tasks' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="col-span-1 md:col-span-2">
                                        <h3 className="text-lg font-bold text-white mb-1">Create Task</h3>
                                        <p className="text-xs text-neutral-500">Define operational tasks and link them to machinery.</p>
                                    </div>

                                    <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Task Title</label>
                                        <input 
                                            required type="text" placeholder="e.g. Monthly Hydraulic Pressure Check"
                                            className="input-base text-lg font-semibold"
                                            value={taskForm.title}
                                            onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                                        />
                                    </div>

                                    <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Description</label>
                                        <textarea 
                                            required placeholder="Enter detailed steps for the procedure..."
                                            className="input-base h-32 resize-none"
                                            value={taskForm.description}
                                            onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                                        ></textarea>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Target Machine</label>
                                        <div className="relative">
                                            {machines.length > 0 ? (
                                                <select 
                                                    className="input-base appearance-none cursor-pointer font-mono text-xs"
                                                    value={taskForm.target_machine}
                                                    onChange={e => setTaskForm({...taskForm, target_machine: e.target.value})}
                                                >
                                                    {machines.map((m, i) => <option key={i} value={m}>{m}</option>)}
                                                </select>
                                            ) : (
                                                <input 
                                                    type="text" className="input-base" placeholder="Enter machine ID..."
                                                    value={taskForm.target_machine}
                                                    onChange={e => setTaskForm({...taskForm, target_machine: e.target.value})}
                                                />
                                            )}
                                            {machines.length > 0 && <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500"><span className="material-symbols-outlined">expand_more</span></div>}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Priority Level</label>
                                        <div className="relative">
                                            <select 
                                                className="input-base appearance-none cursor-pointer"
                                                value={taskForm.priority}
                                                onChange={e => setTaskForm({...taskForm, priority: e.target.value})}
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                                <option value="Critical">Critical</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500"><span className="material-symbols-outlined">expand_more</span></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Status Message */}
                            {status && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${
                                    status.type === 'success' 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                    <span className="material-symbols-outlined">{status.type === 'success' ? 'check_circle' : 'error'}</span>
                                    <span className="text-sm font-medium">{status.msg}</span>
                                </div>
                            )}

                            {/* Submit */}
                            <div className="pt-4 border-t border-neutral-800 flex justify-end">
                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className={`px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isLoading && <span className="material-symbols-outlined text-sm animate-spin">sync</span>}
                                    {activeTab === 'technicians' ? 'Add Technician to Graph' : 'Create Operational Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
};

export default ResourceManagementPage;