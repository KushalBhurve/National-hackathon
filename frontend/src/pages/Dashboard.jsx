import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  
  // --- UI STATE ---
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef(null);

  // --- DATA STATE ---
  const [machines, setMachines] = useState([]); // List of machines for the dropdown

  // --- MODAL STATE ---
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddMachineModal, setShowAddMachineModal] = useState(false);

  // --- FORM STATE: UPLOAD ---
  const [machinery, setMachinery] = useState('');
  const [manualType, setManualType] = useState('Maintenance Manual');
  const [selectedFile, setSelectedFile] = useState(null);

  // --- FORM STATE: ADD MACHINE ---
  const [newMachineForm, setNewMachineForm] = useState({
    name: '',
    location: '',
    type: 'General'
  });

  // --- API STATUS ---
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null

  // --- 1. FETCH MACHINES ON MOUNT ---
  const fetchMachines = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/agent/filters');
      const data = await res.json();
      setMachines(data.machinery || []);
      
      // If we have machines and no selection yet, default to the first one
      if (data.machinery?.length > 0 && !machinery) {
        setMachinery(data.machinery[0]);
      }
    } catch (e) {
      console.error("Failed to fetch machines");
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

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

  const handleLogout = () => navigate('/');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // --- ACTION: ADD NEW MACHINE NODE ---
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
        
        // Refresh the list so the new machine appears in the Upload Dropdown immediately
        await fetchMachines();
        
        setShowAddMachineModal(false);
        setNewMachineForm({ name: '', location: '', type: 'General' });
        alert("Machine Node created successfully!");
        
    } catch (error) {
        console.error(error);
        alert("Failed to add machine.");
    } finally {
        setIsUploading(false);
    }
  };

  // --- ACTION: UPLOAD PDF & LINK TO MACHINE ---
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !machinery) return;

    setIsUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('machinery', machinery); // The backend uses this name to link the graph
    formData.append('manual_type', manualType);

    try {
      const response = await fetch('http://localhost:8000/api/ingest', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      setUploadStatus('success');
      
      // Reset after delay
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadStatus(null);
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
      {/* Inject Fonts/Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Noto+Sans:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .dark ::-webkit-scrollbar { width: 8px; height: 8px; }
        .dark ::-webkit-scrollbar-track { background: #101922; }
        .dark ::-webkit-scrollbar-thumb { background: #283039; border-radius: 4px; }
      `}</style>

      {/* --- SIDEBAR --- */}
      <div 
        className={`hidden md:flex flex-col border-r border-slate-200 dark:border-[#283039] bg-white dark:bg-[#111418] flex-shrink-0 transition-all duration-300 ease-in-out z-40 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <div className="flex flex-col h-full p-4 justify-between">
            <div className="flex flex-col gap-8">
                {/* Logo */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
                    <div className="flex items-center gap-2 text-[#137fec]">
                        <span className="material-symbols-outlined text-[32px]">precision_manufacturing</span>
                        {!isCollapsed && <h1 className="text-xl font-['Space_Grotesk',sans-serif] font-bold">FactoryOS</h1>}
                    </div>
                </div>
                {/* Navigation */}
                <div className="flex flex-col gap-2">
                    <button onClick={() => navigate('/dashboard')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#137fec] text-white shadow-lg shadow-[#137fec]/20 transition-all ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                        <span className="material-symbols-outlined text-[20px]">dns</span>
                        {!isCollapsed && <p className="text-sm font-medium">Data Sources</p>}
                    </button>
                    <button onClick={() => navigate('/resources')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c252e] transition-colors group ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                        <span className="material-symbols-outlined text-[20px]">group_add</span>
                        {!isCollapsed && <p className="text-sm font-medium">Resources</p>}
                    </button>
                    <button onClick={() => navigate('/compliance')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c252e] transition-colors group ${isCollapsed ? 'justify-center' : 'w-full text-left'}`}>
                        <span className="material-symbols-outlined text-[20px]">fact_check</span>
                        {!isCollapsed && <p className="text-sm font-medium">Compliance</p>}
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-[1440px] mx-auto w-full">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl md:text-[32px] font-bold font-['Space_Grotesk',sans-serif]">Data Source Management</h1>
                        <p className="text-slate-500 dark:text-[#9dabb9] text-sm max-w-2xl">
                            Configure machinery assets and ingest technical manuals into the Knowledge Graph.
                        </p>
                    </div>
                    
                    {/* ADD BUTTON & DROPDOWN */}
                    <div className="flex items-end relative" ref={addMenuRef}>
                        <button 
                          onClick={() => setShowAddMenu(!showAddMenu)}
                          className="group flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-[#137fec] hover:bg-[#137fec]/90 transition-all text-white gap-2 text-sm font-bold shadow-lg shadow-[#137fec]/20"
                        >
                            <span className="material-symbols-outlined text-[20px]">add_circle</span>
                            <span className="truncate">Add New Source</span>
                        </button>
                        
                        {showAddMenu && (
                          <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                             <div className="p-1">
                                <button 
                                  onClick={() => { setShowAddMenu(false); setShowAddMachineModal(true); }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#283039] rounded-lg text-left transition-colors"
                                >
                                   <span className="material-symbols-outlined text-[20px] text-amber-500">precision_manufacturing</span>
                                   <div>
                                     <p className="font-semibold leading-none">Add Machinery</p>
                                     <p className="text-[10px] text-slate-400 mt-0.5">Create Graph Node</p>
                                   </div>
                                </button>
                                
                                <div className="h-px bg-slate-100 dark:bg-[#283039] my-1"></div>
                                
                                <button 
                                  onClick={() => { setShowAddMenu(false); setShowUploadModal(true); }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#283039] rounded-lg text-left transition-colors"
                                >
                                   <span className="material-symbols-outlined text-[20px] text-purple-500">upload_file</span>
                                   <div>
                                     <p className="font-semibold leading-none">Upload Manual</p>
                                     <p className="text-[10px] text-slate-400 mt-0.5">Link PDF to Machine</p>
                                   </div>
                                </button>
                             </div>
                          </div>
                        )}
                    </div>
                </div>

                {/* --- STATS CARDS --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                     <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] shadow-sm relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-4 opacity-5">
                             <span className="material-symbols-outlined text-6xl text-[#137fec]">dns</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Total Nodes</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold font-['Space_Grotesk',sans-serif]">{machines.length}</p>
                            <span className="text-emerald-500 text-xs font-medium">Active</span>
                        </div>
                     </div>
                     {/* Placeholder Stats */}
                     <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] shadow-sm relative overflow-hidden">
                         <div className="absolute right-0 top-0 p-4 opacity-5"><span className="material-symbols-outlined text-6xl text-emerald-500">sensors</span></div>
                         <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Live Streams</p>
                         <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold font-['Space_Grotesk',sans-serif]">38</p>
                     </div>
                     <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] shadow-sm relative overflow-hidden">
                         <div className="absolute right-0 top-0 p-4 opacity-5"><span className="material-symbols-outlined text-6xl text-purple-500">hub</span></div>
                         <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Entities</p>
                         <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold font-['Space_Grotesk',sans-serif]">12.4k</p>
                     </div>
                     <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] shadow-sm relative overflow-hidden">
                         <div className="absolute right-0 top-0 p-4 opacity-5"><span className="material-symbols-outlined text-6xl text-amber-500">speed</span></div>
                         <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Ingestion</p>
                         <div className="flex items-baseline gap-2">
                             <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold font-['Space_Grotesk',sans-serif]">450</p>
                             <span className="text-slate-400 text-xs">MB/s</span>
                         </div>
                     </div>
                </div>

                {/* Filters & Grid Placeholder */}
                <div className="flex flex-col lg:flex-row gap-6 mb-6">
                    <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-6">
                        <div className="relative w-full">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">search</span>
                            <input className="w-full h-10 pl-10 pr-4 bg-white dark:bg-[#1c252e] border border-slate-200 dark:border-[#283039] rounded-lg text-sm text-slate-900 dark:text-white outline-none placeholder-slate-400" placeholder="Search sources..." type="text"/>
                        </div>
                    </div>
                    {/* Grid of machines would go here... (using generic placeholder for brevity) */}
                    <div className="flex-1 bg-white dark:bg-[#1c252e] rounded-xl border border-slate-200 dark:border-[#283039] p-8 flex flex-col items-center justify-center text-center">
                        <div className="p-4 rounded-full bg-slate-100 dark:bg-[#283039] text-slate-400 mb-4">
                            <span className="material-symbols-outlined text-4xl">grid_view</span>
                        </div>
                        <h3 className="text-slate-900 dark:text-white font-bold mb-2">Active Data Sources</h3>
                        <p className="text-slate-500 text-sm max-w-md">
                            Select "Add New Source" to create machinery nodes or upload documentation.
                        </p>
                    </div>
                </div>

            </div>
        </main>
      </div>

      {/* --- MODAL 1: ADD MACHINERY --- */}
      {showAddMachineModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-[#1c252e] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-[#283039] animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-[#283039] flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Space_Grotesk',sans-serif]">Add Machinery Node</h3>
                 <button onClick={() => setShowAddMachineModal(false)} className="text-slate-400 hover:text-slate-500"><span className="material-symbols-outlined">close</span></button>
              </div>
              <form onSubmit={handleAddMachine} className="p-6 flex flex-col gap-4">
                 <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Machine Name</label>
                    <input 
                      required type="text" placeholder="e.g. Robotic Arm #5"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-[#283039] bg-slate-50 dark:bg-[#111418] text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-[#137fec]"
                      value={newMachineForm.name}
                      onChange={e => setNewMachineForm({...newMachineForm, name: e.target.value})}
                    />
                 </div>
                 <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Location / Line</label>
                    <input 
                      required type="text" placeholder="e.g. Line B - Station 4"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-[#283039] bg-slate-50 dark:bg-[#111418] text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-[#137fec]"
                      value={newMachineForm.location}
                      onChange={e => setNewMachineForm({...newMachineForm, location: e.target.value})}
                    />
                 </div>
                 <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Type</label>
                    <select 
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-[#283039] bg-slate-50 dark:bg-[#111418] text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-[#137fec]"
                      value={newMachineForm.type}
                      onChange={e => setNewMachineForm({...newMachineForm, type: e.target.value})}
                    >
                        <option value="General">General</option>
                        <option value="Robotics">Robotics</option>
                        <option value="Conveyor">Conveyor</option>
                        <option value="CNC">CNC</option>
                        <option value="Welder">Welder</option>
                    </select>
                 </div>
                 <div className="flex justify-end gap-3 mt-2">
                    <button type="button" onClick={() => setShowAddMachineModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#283039] rounded-lg">Cancel</button>
                    <button type="submit" disabled={isUploading} className="px-4 py-2 text-sm font-bold text-white bg-[#137fec] hover:bg-[#137fec]/90 rounded-lg flex items-center gap-2">
                       {isUploading && <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>}
                       Create Node
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* --- MODAL 2: UPLOAD MANUAL --- */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-[#1c252e] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-[#283039] animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-[#283039] flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Space_Grotesk',sans-serif]">Upload Manual</h3>
                 <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-500"><span className="material-symbols-outlined">close</span></button>
              </div>
              <form onSubmit={handleUpload} className="p-6 flex flex-col gap-4">
                 
                 {/* MACHINERY DROPDOWN (Fetched from Graph) */}
                 <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Link to Machinery</label>
                    <select
                      required
                      value={machinery}
                      onChange={(e) => setMachinery(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-[#283039] bg-slate-50 dark:bg-[#111418] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#137fec] outline-none"
                    >
                        {machines.length === 0 && <option value="">No machines found (Create one first)</option>}
                        {machines.map((m, i) => (
                            <option key={i} value={m}>{m}</option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-500">Links this PDF to the specific Machine Node in the graph.</p>
                 </div>

                 <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Manual Type</label>
                    <select 
                      value={manualType}
                      onChange={(e) => setManualType(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-[#283039] bg-slate-50 dark:bg-[#111418] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#137fec] outline-none"
                    >
                       <option value="Maintenance Manual">Maintenance Manual</option>
                       <option value="Safety Guide">Safety Guide</option>
                       <option value="Technical Specs">Technical Specs</option>
                       <option value="Operational Guide">Operational Guide</option>
                    </select>
                 </div>

                 <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Document (PDF)</label>
                    <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-[#283039] transition-colors cursor-pointer group">
                       <input 
                         type="file" accept="application/pdf" onChange={handleFileChange}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                       />
                       <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-[#137fec] mb-2 transition-colors">upload_file</span>
                       <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                       </p>
                    </div>
                 </div>

                 {uploadStatus === 'success' && (
                    <div className="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg flex items-center gap-2">
                       <span className="material-symbols-outlined text-lg">check_circle</span> Ingestion started successfully.
                    </div>
                 )}
                 {uploadStatus === 'error' && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                       <span className="material-symbols-outlined text-lg">error</span> Upload failed.
                    </div>
                 )}

                 <div className="flex justify-end gap-3 mt-2">
                    <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#283039] rounded-lg">Cancel</button>
                    <button type="submit" disabled={isUploading || !selectedFile || !machinery} className={`px-4 py-2 text-sm font-bold text-white rounded-lg flex items-center gap-2 ${isUploading ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#137fec] hover:bg-[#137fec]/90'}`}>
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