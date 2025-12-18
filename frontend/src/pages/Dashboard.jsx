import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // --- UI STATE ---
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef(null);

  // --- DATA STATE ---
  const [machines, setMachines] = useState([]);

  // --- MODAL STATE ---
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddMachineModal, setShowAddMachineModal] = useState(false);

  // --- FORM STATE ---
  const [machinery, setMachinery] = useState('');
  const [manualType, setManualType] = useState('Maintenance Manual');
  const [selectedFile, setSelectedFile] = useState(null);
  const [newMachineForm, setNewMachineForm] = useState({ name: '', location: '', type: 'General' });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  // --- FETCH DATA ---
  const fetchMachines = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/agent/filters');
      const data = await res.json();
      setMachines(data.machinery || []);
      if (data.machinery?.length > 0 && !machinery) setMachinery(data.machinery[0]);
    } catch (e) { console.error("Failed to fetch machines"); }
  };

  useEffect(() => { fetchMachines(); }, []);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) setShowAddMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (e) => { if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]); };

  const handleAddMachine = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    try {
        const response = await fetch('http://localhost:8000/api/resources/machine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMachineForm)
        });
        if (!response.ok) throw new Error("Failed to add machine");
        await fetchMachines();
        setShowAddMachineModal(false);
        setNewMachineForm({ name: '', location: '', type: 'General' });
        alert("Machine Node created successfully!");
    } catch (error) { console.error(error); alert("Failed to add machine."); } finally { setIsUploading(false); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !machinery) return;
    setIsUploading(true);
    setUploadStatus(null);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('machinery', machinery);
    formData.append('manual_type', manualType);
    try {
      const response = await fetch('http://localhost:8000/api/ingest', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');
      setUploadStatus('success');
      setTimeout(() => { setShowUploadModal(false); setUploadStatus(null); setSelectedFile(null); }, 1500);
    } catch (error) { console.error(error); setUploadStatus('error'); } finally { setIsUploading(false); }
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
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1');
        :root { font-family: 'Inter', sans-serif; }
        .glass-panel { background: rgba(23, 23, 23, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .dark-input { width: 100%; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 0.75rem; padding: 0.75rem 1rem; color: white; outline: none; transition: all 0.2s; }
        .dark-input:focus { border-color: #06b6d4; background: rgba(6, 182, 212, 0.05); }
        input[type="file"]::file-selector-button { display: none; }
      `}</style>

      {/* BACKGROUND GRID */}
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

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto p-6 lg:p-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
              <div>
                <motion.h2 className="text-4xl font-bold text-white font-['Space_Grotesk'] tracking-tight">
                  Knowledge <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Ingestion</span>
                </motion.h2>
                <p className="text-neutral-400 mt-2 text-lg font-light">Map machinery and technical intelligence to the Knowledge Graph.</p>
              </div>

              <div className="relative" ref={addMenuRef}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddMenu(!showAddMenu)} className="px-6 py-3 bg-white text-neutral-950 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all">
                  <span className="material-symbols-outlined">add_circle</span> Connect Data
                </motion.button>
                <AnimatePresence>
                  {showAddMenu && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full right-0 mt-2 w-56 glass-panel rounded-2xl p-2 shadow-2xl z-50">
                      <button onClick={() => { setShowAddMenu(false); setShowAddMachineModal(true); }} className="w-full flex items-center gap-3 px-3 py-3 text-sm text-neutral-300 hover:bg-cyan-500/10 hover:text-cyan-400 rounded-xl transition-all">
                        <span className="material-symbols-outlined">settings_input_component</span> Add Machinery
                      </button>
                      <button onClick={() => { setShowAddMenu(false); setShowUploadModal(true); }} className="w-full flex items-center gap-3 px-3 py-3 text-sm text-neutral-300 hover:bg-cyan-500/10 hover:text-cyan-400 rounded-xl transition-all">
                        <span className="material-symbols-outlined">auto_stories</span> Ingest PDF
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* --- STATS GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {[
                { label: 'Active Nodes', val: machines.length, icon: 'hub', color: 'text-cyan-400' },
                { label: 'Uptime', val: '99.9%', icon: 'bolt', color: 'text-emerald-400' },
                { label: 'Manuals', val: '24', icon: 'menu_book', color: 'text-purple-400' },
                { label: 'Vector Speed', val: '450', unit: 'MB/s', icon: 'speed', color: 'text-amber-400' }
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="glass-panel p-6 rounded-2xl group hover:border-neutral-700 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                     <div className={`p-2 rounded-lg bg-neutral-800/50 ${stat.color} border border-white/5`}><span className="material-symbols-outlined">{stat.icon}</span></div>
                  </div>
                  <h4 className="text-3xl font-bold text-white font-['Space_Grotesk']">{stat.val}<span className="text-xs text-neutral-500 ml-1">{stat.unit}</span></h4>
                  <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* --- SYSTEM STATUS --- */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative p-[1px] bg-gradient-to-r from-cyan-500/30 via-purple-500/10 to-emerald-500/30 rounded-3xl overflow-hidden group">
              <div className="bg-neutral-900/90 rounded-[23px] p-12 flex flex-col items-center justify-center text-center backdrop-blur-3xl">
                <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6 border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                  <span className="material-symbols-outlined text-4xl text-cyan-400">cloud_sync</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 font-['Space_Grotesk']">System Online</h3>
                <p className="text-neutral-400 max-w-lg text-sm leading-relaxed">
                  Knowledge Graph Orchestrator is operational. Currently monitoring <span className="text-white font-bold">{machines.length}</span> active machinery nodes.
                </p>
              </div>
            </motion.div>

          </motion.div>
        </main>
      </div>
      
      {/* --- MODAL 1: ADD MACHINERY --- */}
      <AnimatePresence>
        {showAddMachineModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-panel w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white font-['Space_Grotesk']">Initialize Node</h3>
                    <button onClick={() => setShowAddMachineModal(false)} className="text-neutral-500 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                </div>
                <form onSubmit={handleAddMachine} className="space-y-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Asset Designation</label><input required className="dark-input" placeholder="e.g. Robotic Arm #5" value={newMachineForm.name} onChange={e => setNewMachineForm({...newMachineForm, name: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Location</label><input required className="dark-input" placeholder="e.g. Line B" value={newMachineForm.location} onChange={e => setNewMachineForm({...newMachineForm, location: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Type</label><select className="dark-input appearance-none" value={newMachineForm.type} onChange={e => setNewMachineForm({...newMachineForm, type: e.target.value})}><option value="General" className="bg-neutral-900">General</option><option value="Robotics" className="bg-neutral-900">Robotics</option><option value="Conveyor" className="bg-neutral-900">Conveyor</option></select></div>
                  <button type="submit" disabled={isUploading} className="w-full py-3 mt-4 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-500 transition-all flex items-center justify-center gap-2">{isUploading && <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>} Create Node</button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: UPLOAD MANUAL --- */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-panel w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white font-['Space_Grotesk']">Ingest Manual</h3>
                    <button onClick={() => setShowUploadModal(false)} className="text-neutral-500 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                </div>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Target Node</label>
                    <select required value={machinery} onChange={(e) => setMachinery(e.target.value)} className="dark-input appearance-none">{machines.map((m, i) => (<option key={i} value={m} className="bg-neutral-900">{m}</option>))}</select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Type</label>
                    <select value={manualType} onChange={(e) => setManualType(e.target.value)} className="dark-input appearance-none"><option value="Maintenance Manual" className="bg-neutral-900">Maintenance Manual</option><option value="Safety Guide" className="bg-neutral-900">Safety Guide</option></select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Document Source</label>
                    <div className="relative border border-dashed border-neutral-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer group">
                        <input type="file" accept="application/pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <span className="material-symbols-outlined text-3xl text-neutral-500 group-hover:text-cyan-400 mb-2 transition-colors">upload_file</span>
                        <p className="text-xs font-medium text-neutral-300">{selectedFile ? <span className="text-emerald-400">{selectedFile.name}</span> : "Drop PDF here"}</p>
                    </div>
                  </div>
                  {uploadStatus === 'success' && (<div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-sm">check_circle</span> Ingestion pipeline started.</div>)}
                  <button type="submit" disabled={isUploading || !selectedFile || !machinery} className={`w-full py-3 mt-2 text-white rounded-xl font-bold transition-all ${isUploading || !selectedFile ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500'}`}>{isUploading ? 'Ingesting...' : 'Start Ingestion'}</button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardPage;