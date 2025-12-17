import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackgroundGradientAnimation } from '../components/ui/background-gradient-animation'; // Ensure the path is correct


const HomePage = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen font-['Noto_Sans',sans-serif] antialiased overflow-x-hidden bg-[#f6f7f8] dark:bg-[#101922] text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Inject Fonts & Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Noto+Sans:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        
        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #101922; }
        ::-webkit-scrollbar-thumb { background: #233648; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #137fec; }

        /* Animation frames required for the Aceternity component if not using a global tailwind config */
        @keyframes moveInCircle {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes moveVertical {
          0% { transform: translateY(-50%); }
          50% { transform: translateY(50%); }
          100% { transform: translateY(-50%); }
        }
        @keyframes moveHorizontal {
          0% { transform: translateX(-50%) translateY(-10%); }
          50% { transform: translateX(50%) translateY(10%); }
          100% { transform: translateX(-50%) translateY(-10%); }
        }
        .animate-first { animation: moveVertical 30s ease infinite; }
        .animate-second { animation: moveInCircle 20s reverse infinite; }
        .animate-third { animation: moveInCircle 40s linear infinite; }
        .animate-fourth { animation: moveHorizontal 40s ease infinite; }
        .animate-fifth { animation: moveInCircle 20s ease infinite; }
      `}</style>

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-[#e5e7eb] dark:border-[#233648] bg-[#f6f7f8]/80 dark:bg-[#101922]/80 backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#137fec]/10 text-[#137fec]">
              <span className="material-symbols-outlined text-2xl">precision_manufacturing</span>
            </div>
            <h2 className="text-lg font-['Space_Grotesk',sans-serif] font-bold tracking-tight text-slate-900 dark:text-white">AutoMaint AI</h2>
          </div>
          <nav className="hidden md:flex flex-1 justify-center gap-8">
            <a className="text-sm font-medium text-slate-600 hover:text-[#137fec] dark:text-slate-300 dark:hover:text-[#137fec] transition-colors" href="#">Platform</a>
            <a className="text-sm font-medium text-slate-600 hover:text-[#137fec] dark:text-slate-300 dark:hover:text-[#137fec] transition-colors" href="#">Solutions</a>
            <a className="text-sm font-medium text-slate-600 hover:text-[#137fec] dark:text-slate-300 dark:hover:text-[#137fec] transition-colors" href="#">Case Studies</a>
            <a className="text-sm font-medium text-slate-600 hover:text-[#137fec] dark:text-slate-300 dark:hover:text-[#137fec] transition-colors" href="#">Resources</a>
          </nav>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-[#137fec] dark:hover:text-[#137fec] transition-colors"
            >
              <span className="material-symbols-outlined text-xl">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <button 
              onClick={() => navigate('/login')}
              className="hidden sm:flex h-10 items-center justify-center rounded-lg border border-slate-200 dark:border-[#233648] bg-transparent px-4 text-sm font-bold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-[#233648] transition-colors"
            >
              Log In
            </button>

            <button className="hidden sm:flex h-10 items-center justify-center rounded-lg bg-[#137fec] px-4 text-sm font-bold text-white shadow-lg shadow-[#137fec]/20 hover:bg-blue-600 transition-all">
              Request Demo
            </button>
            <button className="md:hidden p-2 text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with Aceternity Background Component */}
      <section className="relative w-full">
        <BackgroundGradientAnimation 
          containerClassName="py-24 lg:py-32" 
          primaryBlue="19, 127, 236" 
          secondaryBlue="15, 23, 42" // Navy instead of Purple
          gradientBackgroundStart={isDark ? "#101922" : "#f6f7f8"}
          gradientBackgroundEnd={isDark ? "#0a0f14" : "#e5e7eb"}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
              <div className="flex flex-col gap-6 text-center lg:text-left">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#137fec]/20 bg-[#137fec]/10 px-3 py-1 mx-auto lg:mx-0">
                  <span className="flex h-2 w-2 rounded-full bg-[#137fec] animate-pulse"></span>
                  <span className="text-xs font-medium text-[#137fec] uppercase tracking-wide">Enterprise Release v2.0</span>
                </div>
                <h1 className="text-4xl font-black font-['Space_Grotesk',sans-serif] leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl xl:text-6xl">
                  Master the Machine: <span className="text-[#137fec]">Agentic AI</span> for Assembly Lines
                </h1>
                <p className="text-lg font-normal leading-relaxed text-slate-600 dark:text-slate-300 sm:text-xl max-w-2xl mx-auto lg:mx-0">
                  Leverage enterprise knowledge graphs to give your AI the context it needs to predict, diagnose, and fix complex machinery faults in real-time.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start mt-4">
                  <button className="h-12 rounded-lg bg-[#137fec] px-8 text-base font-bold text-white shadow-lg shadow-[#137fec]/25 hover:bg-blue-600 hover:shadow-[#137fec]/40 transition-all">
                    Request Demo
                  </button>
                  <button className="h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/20 dark:bg-black/20 backdrop-blur-md px-8 text-base font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-[#233648] transition-all">
                    View Documentation
                  </button>
                </div>
              </div>
              
              <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
                <div className="aspect-square lg:aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#e5e7eb] dark:border-[#233648] bg-white/50 dark:bg-[#192633]/50 backdrop-blur-xl shadow-2xl relative group">
                  <div className="absolute top-4 left-4 z-10 flex gap-2">
                    {/* <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                    <div className="h-2 w-2 rounded-full bg-green-500"></div> */}
                  </div>
                  <div className="absolute bottom-6 right-6 z-10 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                      <span className="text-xs text-white font-mono">System Optimal</span>
                    </div>
                  </div>
                  <div 
                    className="h-full w-full bg-cover bg-center opacity-90 transition-transform duration-700 group-hover:scale-105" 
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBjGK5uKQpJOQPAWvr9xmr8bcqlmoj0xwBBeZtSjRGx0srkryT7292Dk1jOM8nVYpLgBXB_apFYc6mmhIPfYm2ENZ6Ss_lDQvgKOTdblRt9KlNwD5-S_5z_-sRguaUGr5CvwSzBHmzI5iMnkNZNRVjCfKqMttQaXgM1txIfLijt10cLE_XAa0sDAEx3xM30mM3aPEK8lOSGDUnyx6Bh6YBQCuXLciWka5TLlYsCP2IgBSS6uhFGDXbhlFcWs62xggEr54Ha7bC75PEF')" }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#f6f7f8] dark:from-[#101922] via-transparent to-transparent opacity-20"></div>
                </div>
              </div>
            </div>
          </div>
        </BackgroundGradientAnimation>
      </section>

      {/* Trust Bar */}
      <section className="py-10 border-y border-[#e5e7eb] dark:border-[#233648] bg-white dark:bg-[#192633]/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-6 text-sm font-semibold uppercase tracking-wider text-slate-500">Trusted by leading automotive manufacturers</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale transition-opacity hover:grayscale-0 hover:opacity-100">
            <div className="flex items-center gap-2 text-xl font-bold dark:text-white font-['Space_Grotesk',sans-serif]"><span className="material-symbols-outlined">directions_car</span> AUTO-X</div>
            <div className="flex items-center gap-2 text-xl font-bold dark:text-white font-['Space_Grotesk',sans-serif]"><span className="material-symbols-outlined">speed</span> VELOCITY</div>
            <div className="flex items-center gap-2 text-xl font-bold dark:text-white font-['Space_Grotesk',sans-serif]"><span className="material-symbols-outlined">settings_suggest</span> GEARWORKS</div>
            <div className="flex items-center gap-2 text-xl font-bold dark:text-white font-['Space_Grotesk',sans-serif]"><span className="material-symbols-outlined">electric_car</span> VOLT-MFG</div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Grid */}
      <section className="py-24 bg-[#f6f7f8] dark:bg-[#101922] relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 md:text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-['Space_Grotesk',sans-serif] tracking-tight text-slate-900 dark:text-white sm:text-4xl">Core Capabilities</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Built for the rigorous demands of automotive manufacturing, our platform ensures your AI agents are always context-aware and synchronized.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group relative overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-[#233648] bg-white dark:bg-[#192633] p-6 transition-all hover:border-[#137fec]/50 hover:shadow-lg hover:shadow-[#137fec]/5">
              <div className="mb-4 inline-flex rounded-lg bg-[#137fec]/10 p-3 text-[#137fec] group-hover:bg-[#137fec] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-3xl">memory</span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Persistent Memory</h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                AI that retains a complete history of every breakdown and repair for smarter future diagnoses.
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-[#233648] bg-white dark:bg-[#192633] p-6 transition-all hover:border-[#137fec]/50 hover:shadow-lg hover:shadow-[#137fec]/5">
              <div className="mb-4 inline-flex rounded-lg bg-[#137fec]/10 p-3 text-[#137fec] group-hover:bg-[#137fec] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-3xl">plagiarism</span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Contextual Retrieval</h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Instant access to machine-specific manuals and configuration logs via semantic search.
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-[#233648] bg-white dark:bg-[#192633] p-6 transition-all hover:border-[#137fec]/50 hover:shadow-lg hover:shadow-[#137fec]/5">
              <div className="mb-4 inline-flex rounded-lg bg-[#137fec]/10 p-3 text-[#137fec] group-hover:bg-[#137fec] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-3xl">hub</span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Shared State Models</h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Synchronized intelligence across the entire factory floor ensures all agents act on the same truth.
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-[#233648] bg-white dark:bg-[#192633] p-6 transition-all hover:border-[#137fec]/50 hover:shadow-lg hover:shadow-[#137fec]/5">
              <div className="mb-4 inline-flex rounded-lg bg-[#137fec]/10 p-3 text-[#137fec] group-hover:bg-[#137fec] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-3xl">autorenew</span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Continuous Updates</h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Models that learn in real-time from every maintenance event to constantly improve accuracy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white dark:bg-[#192633] border-t border-[#e5e7eb] dark:border-[#233648]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl font-bold font-['Space_Grotesk',sans-serif] tracking-tight text-slate-900 dark:text-white sm:text-4xl mb-6">
                From Sensor to Solution
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-10">
                A seamless pipeline that transforms raw sensor data into actionable maintenance protocols.
              </p>
              <div className="flex flex-col gap-8 relative">
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-[#e5e7eb] dark:bg-[#233648] hidden md:block"></div>
                
                <div className="relative flex gap-6">
                  <div className="flex-none z-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white dark:border-[#192633] bg-[#137fec] text-white font-bold">1</div>
                  </div>
                  <div>
                    <h4 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                      <span className="material-symbols-outlined text-[#137fec]">sensors</span> Ingestion
                    </h4>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Sensors detect anomalies in vibration or heat signatures across the assembly line.</p>
                  </div>
                </div>
                <div className="relative flex gap-6">
                  <div className="flex-none z-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white dark:border-[#192633] bg-[#f6f7f8] dark:bg-[#101922] text-slate-500 font-bold border border-slate-300 dark:border-slate-600">2</div>
                  </div>
                  <div>
                    <h4 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                      <span className="material-symbols-outlined text-[#137fec]">account_tree</span> Contextualization
                    </h4>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Data is mapped to the machine's specific node in the Knowledge Graph for full context.</p>
                  </div>
                </div>
                <div className="relative flex gap-6">
                  <div className="flex-none z-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white dark:border-[#192633] bg-[#f6f7f8] dark:bg-[#101922] text-slate-500 font-bold border border-slate-300 dark:border-slate-600">3</div>
                  </div>
                  <div>
                    <h4 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                      <span className="material-symbols-outlined text-[#137fec]">psychology</span> Decision
                    </h4>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Agentic AI analyzes the fault against history and manuals to determine the best fix.</p>
                  </div>
                </div>
                <div className="relative flex gap-6">
                  <div className="flex-none z-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white dark:border-[#192633] bg-[#f6f7f8] dark:bg-[#101922] text-slate-500 font-bold border border-slate-300 dark:border-slate-600">4</div>
                  </div>
                  <div>
                    <h4 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                      <span className="material-symbols-outlined text-[#137fec]">build</span> Action
                    </h4>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Maintenance protocols are automatically dispatched to technicians or executed autonomously.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 h-full min-h-[400px]">
              <div className="sticky top-24 overflow-hidden rounded-2xl border border-[#e5e7eb] dark:border-[#233648] bg-[#f6f7f8] dark:bg-[#101922] shadow-2xl">
                <div 
                  className="w-full bg-cover bg-center aspect-[4/5]" 
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDEvQBUmFamM5Dn56AzoH3p1LBIV8ft-wgpokROiJHv-C_WcaiwtzQjD0u2G91k67AQiZkHHdbpH73E43H2KRIZHTKCRoFD8B6VJesFJGrlXG4KmyFCFD_fekeUFPAJyBwdfbmCyKVz60a52vqJdxVvn23CK8YfQNjWxi2sb8IXTAGPFdSAqhClPCx1HdAbUL0Ip9YEsTe9S6LSFTEKpSKiWkAiGibMcNMWnidKR-6zKgST3M1Bp3nJoScfc_bfTw70xWNEYN98fOTU')" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer (Condensed for space) */}
      <footer className="border-t border-[#e5e7eb] dark:border-[#233648] bg-white dark:bg-[#192633] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm text-slate-500">© 2024 AutoMaint AI Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;