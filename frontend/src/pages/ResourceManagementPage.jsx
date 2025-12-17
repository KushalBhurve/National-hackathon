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
  const [machines, setMachines] = useState([]); // For dropdown

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

      setStatus({ type: 'success', msg: `${activeTab === 'technicians' ? 'Technician' : 'Task'} added to Knowledge Graph!` });
      
      // Reset logic (optional)
      if (activeTab === 'tasks') setTaskForm(prev => ({ ...prev, title: '', description: '' }));
      else setTechForm(prev => ({ ...prev, name: '' }));

    } catch (error) {
      setStatus({ type: 'error', msg: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-['Noto_Sans',sans-serif] antialiased overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] text-slate-900 dark:text-white flex flex-row">
       {/* Inject Fonts/Styles - Reusing your existing block */}
       <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Noto+Sans:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .dark ::-webkit-scrollbar { width: 8px; height: 8px; }
        .dark ::-webkit-scrollbar-track { background: #101922; }
        .dark ::-webkit-scrollbar-thumb { background: #283039; border-radius: 4px; }
      `}</style>

      {/* --- SIDEBAR (Copied structure from Dashboard) --- */}
      <div 
        className={`hidden md:flex flex-col border-r border-slate-200 dark:border-[#283039] bg-white dark:bg-[#111418] flex-shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'}`}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <div className="flex flex-col h-full p-4 justify-between">
            <div className="flex flex-col gap-8">
                {/* Header */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
                    <div className="flex items-center gap-2 text-[#137fec]">
                        <span className="material-symbols-outlined text-[32px]">precision_manufacturing</span>
                        {!isCollapsed && <h1 className="text-xl font-['Space_Grotesk',sans-serif] font-bold">FactoryOS</h1>}
                    </div>
                </div>
                {/* Nav */}
                <div className="flex flex-col gap-2">
                    <button onClick={() => navigate('/dashboard')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c252e] transition-colors group ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                        <span className="material-symbols-outlined text-[20px]">dns</span>
                        {!isCollapsed && <p className="text-sm font-medium">Data Sources</p>}
                    </button>
                     {/* Active Page */}
                     <button className={`flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#137fec] text-white shadow-lg shadow-[#137fec]/20 transition-all ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                        <span className="material-symbols-outlined text-[20px]">group_add</span>
                        {!isCollapsed && <p className="text-sm font-medium">Resources</p>}
                    </button>
                    <button onClick={() => navigate('/agent')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c252e] transition-colors group ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                        <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                        {!isCollapsed && <p className="text-sm font-medium">Agents</p>}
                    </button>
                </div>
            </div>
            {/* Profile */}
            <div className="px-2 pb-2">
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-3 rounded-xl bg-slate-100 dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039]`}>
                    <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center text-white text-xs">AD</div>
                    {!isCollapsed && <button onClick={handleLogout} className="ml-auto text-slate-400 hover:text-red-400"><span className="material-symbols-outlined text-lg">logout</span></button>}
                </div>
            </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f6f7f8] dark:bg-[#101922] relative">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto w-full">
                
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-slate-900 dark:text-white text-3xl font-bold font-['Space_Grotesk',sans-serif] mb-2">Resource Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Add staff and operational tasks directly to the Knowledge Graph.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-[#283039]">
                    <button 
                        onClick={() => setActiveTab('technicians')}
                        className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'technicians' ? 'border-[#137fec] text-[#137fec]' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        <span className="material-symbols-outlined text-lg">engineering</span>
                        Technicians
                    </button>
                    <button 
                        onClick={() => setActiveTab('tasks')}
                        className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'tasks' ? 'border-[#137fec] text-[#137fec]' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        <span className="material-symbols-outlined text-lg">assignment</span>
                        Operational Tasks
                    </button>
                </div>

                {/* Form Container */}
                <div className="bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-[#283039] p-6 md:p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        
                        {/* --- TECHNICIAN FORM --- */}
                        {activeTab === 'technicians' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                                        <input 
                                            required
                                            type="text" 
                                            className="h-10 px-3 rounded-lg border border-slate-200 dark:border-[#283039] bg-slate-50 dark:bg-[#111418] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#137fec]"
                                            value={techForm.name}
                                            onChange={e => setTechForm({...techForm, name: e.target.value})}
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Role</label>
                                        <input 
                                            required
                                            type="text" 
                                            className="h-10 px-3 rounded-lg border border-slate-200 dark:border-[#283039] bg-slate-50 dark:bg-[#111418] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#137fec]"
                                            value={techForm.role}
                                            onChange={e => setTechForm({...techForm, role: e.target.value})}
                                            placeholder="e.g. Senior Engineer"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Certification Level</label>
                                        <select 
                                            className="h-10 px-3 rounded-lg border border-slate-200 dark:border-[#283039] bg-slate-50 dark:bg-[#111418] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#137fec]"
                                            value={techForm.certification_level}
                                            onChange={e => setTechForm({...techForm, certification_level: e.target.value})}
                                        >
                                            <option value="L1">L1 (Basic)</option>
                                            <option value="L2">L2 (Intermediate)</option>
                                            <option value="L3">L3 (Advanced/High Voltage)</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                                        <select 
                                            className="h-10 px-3 rounded-lg border border-slate-200 dark:border-[#283039] bg-slate-50 dark:bg-[#111418] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#137fec]"
                                            value={techForm.status}
                                            onChange={e => setTechForm({...techForm, status: e.target.value})}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="On Leave">On Leave</option>
                                            <option value="Busy">Busy</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* --- TASK FORM --- */}
                        {activeTab === 'tasks' && (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Task Title</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="h-10 px-3 rounded-lg border border-slate-200 dark:border-[#283039] bg-slate-50 dark:bg-[#111418] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#137fec]"
                                        value={taskForm.title}
                                        onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                                        placeholder="e.g. Monthly Hydraulic Check"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
                                    <textarea 
                                        required
                                        className="h-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-[#283039] bg-slate-50 dark:bg-[#111418] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#137fec] resize-none"
                                        value={taskForm.description}
                                        onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                                        placeholder="Detailed steps for the task..."
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Target Machine</label>
                                        {machines.length > 0 ? (
                                            <select 
                                                className="h-10 px-3 rounded-lg border border-slate-200 dark:border-[#283039] bg-slate-50 dark:bg-[#111418] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#137fec]"
                                                value={taskForm.target_machine}
                                                onChange={e => setTaskForm({...taskForm, target_machine: e.target.value})}
                                            >
                                                {machines.map((m, i) => <option key={i} value={m}>{m}</option>)}
                                            </select>
                                        ) : (
                                            <input 
                                                type="text"
                                                className="h-10 px-3 rounded-lg border border-slate-200 dark:border-[#283039] bg-slate-50 dark:bg-[#111418] text-slate-900 dark:text-white"
                                                placeholder="Enter machine name..."
                                                value={taskForm.target_machine}
                                                onChange={e => setTaskForm({...taskForm, target_machine: e.target.value})}
                                            />
                                        )}
                                        <p className="text-xs text-slate-500">Links this task to the machine node in the Graph.</p>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                                        <select 
                                            className="h-10 px-3 rounded-lg border border-slate-200 dark:border-[#283039] bg-slate-50 dark:bg-[#111418] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#137fec]"
                                            value={taskForm.priority}
                                            onChange={e => setTaskForm({...taskForm, priority: e.target.value})}
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                            <option value="Critical">Critical</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Status Message */}
                        {status && (
                            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                                <span className="material-symbols-outlined text-lg">{status.type === 'success' ? 'check_circle' : 'error'}</span>
                                {status.msg}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4">
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className={`px-6 py-2.5 rounded-lg bg-[#137fec] text-white font-bold text-sm shadow-lg shadow-[#137fec]/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading && <span className="material-symbols-outlined text-sm animate-spin">sync</span>}
                                {activeTab === 'technicians' ? 'Add Technician' : 'Create Task'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
};

export default ResourceManagementPage;