import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SystemArchitecture = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ingestion');

  const flows = {
    ingestion: [
      { id: "input", title: "Unstructured Data", type: "Source", icon: "description", color: "#3b82f6" },
      { id: "splitter", title: "Semantic Splitter", type: "LangChain Agent", icon: "account_tree", color: "#8b5cf6" },
      // UPDATED: Added 'highlight' property here
      { id: "transformer", title: "Graph Transformer", type: "GPT-4o Reasoning", icon: "psychology", color: "#10b981", highlight: "Significance Mapping" },
      { id: "storage", title: "Neo4j + ChromaDB", type: "Hybrid DB", icon: "database", color: "#f59e0b" }
    ],
    retrieval: [
      { id: "query", title: "User Query", type: "Intent", icon: "search", color: "#3b82f6" },
      { id: "vector", title: "Vector Search", type: "ChromaDB", icon: "travel_explore", color: "#6366f1" },
      { id: "cypher", title: "Dynamic Cypher", type: "Graph QA Chain", icon: "terminal", color: "#f43f5e" },
      { id: "llm", title: "RAG Synthesis", type: "Final Output", icon: "auto_awesome", color: "#eab308" }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-['Noto_Sans'] relative overflow-hidden flex flex-col items-center">
      {/* ACETERNITY EFFECT: Background Gradient Mesh */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Noto+Sans:wght@400;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1');
        
        .glass-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>

      <div className="relative z-10 w-full max-w-7xl p-8 lg:p-12">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk'] text-white tracking-tighter">
                System <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Architecture</span>
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Real-time Hybrid Knowledge Graph Pipeline</p>
          </motion.div>
          
          <div className="flex bg-slate-900/80 p-1.5 rounded-full border border-slate-800 shadow-2xl backdrop-blur-md">
            {['ingestion', 'retrieval'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-8 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-500 ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute inset-0 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)]" />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </div>
        </header>

        {/* ACETERNITY EFFECT: The Moving Path Flow */}
        <div className="relative flex flex-col lg:flex-row justify-between items-center gap-12 py-10 px-4">
          <AnimatePresence mode="wait">
            {flows[activeTab].map((node, index) => (
              <motion.div
                key={`${activeTab}-${node.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex flex-col items-center w-full lg:w-auto"
              >
                {/* Connection Line with Animated Pulse */}
                {index !== flows[activeTab].length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 left-[100%] w-full h-[1px] bg-slate-800 -translate-y-1/2">
                    <motion.div 
                      animate={{ left: ["0%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute top-[-2px] w-12 h-[5px] bg-gradient-to-r from-transparent via-blue-500 to-transparent blur-[2px]"
                    />
                  </div>
                )}

                {/* Node Box (Moving Border Style) */}
                <div className="glass-card group w-56 h-64 rounded-[32px] flex flex-col items-center justify-center p-6 transition-all duration-500 hover:translate-y-[-8px] hover:border-blue-500/50 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] overflow-hidden">
                  {/* Subtle Background Icon */}
                  <span className="material-symbols-outlined absolute text-[120px] opacity-[0.03] rotate-12 -z-10">{node.icon}</span>
                  
                  <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <span className="material-symbols-outlined text-4xl" style={{ color: node.color }}>{node.icon}</span>
                  </div>
                  
                  <h3 className="text-md font-bold text-white text-center font-['Space_Grotesk'] leading-tight">{node.title}</h3>
                  
                  <div className="mt-3 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 font-mono tracking-widest">{node.type}</span>
                  </div>

                  {/* UPDATED: Logic to display the Highlight Point if it exists */}
                  {node.highlight && (
                    <div className="mt-2 flex items-center gap-1">
                        <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></span>
                        <span className="text-[10px] text-emerald-400/80 font-mono">{node.highlight}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Terminal Section (Tracing Beam Style) */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-[1px] bg-gradient-to-b from-slate-700 to-transparent rounded-3xl">
                <div className="bg-slate-950/90 rounded-[23px] p-8 h-full">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                        <span className="text-xs font-mono text-slate-500 ml-2 italic">backend_orchestrator.py</span>
                    </div>
                    <div className="space-y-3 font-mono text-[13px]">
                        <p className="text-blue-400">Initialize <span className="text-slate-300">SemanticIngestionPipeline</span></p>
                        <p className="text-slate-500 italic"># Running SemanticChunker on {activeTab === 'ingestion' ? 'Documents' : 'Queries'}</p>
                        <p className="text-emerald-400 underline underline-offset-4">Success: Node graph state synchronized.</p>
                        <p className="text-slate-400">{`> ChromaDB Context: OK`}</p>
                        <p className="text-slate-400">{`> Neo4j Schema: OK`}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col justify-center space-y-6 lg:pl-10">
                <h4 className="text-2xl font-bold text-white font-['Space_Grotesk'] tracking-tight">Technical Highlights</h4>
                <ul className="space-y-4">
                    {[
                        { t: "Dynamic Cypher", d: "LLM-generated queries for zero-schema lag." },
                        { t: "Semantic Splitting", d: "Content-aware chunking based on cosine similarity." },
                        { t: "Hybrid RAG", d: "Combining Graph knowledge with Vector retrieval." }
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-4">
                            <span className="material-symbols-outlined text-blue-500 mt-1">check_circle</span>
                            <div>
                                <p className="font-bold text-slate-200">{item.t}</p>
                                <p className="text-sm text-slate-500">{item.d}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        {/* Footer Navigation */}
        <footer className="mt-20 flex justify-center border-t border-slate-900 pt-12">
            <button 
                onClick={() => navigate('/dashboard')}
                className="group relative px-10 py-4 bg-white text-slate-950 rounded-full font-bold overflow-hidden transition-all hover:pr-14"
            >
                <span className="relative z-10">Back to Factory Dashboard</span>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">arrow_forward</span>
            </button>
        </footer>
      </div>
    </div>
  );
};

export default SystemArchitecture;