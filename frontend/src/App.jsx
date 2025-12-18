import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/Dashboard';
import SystemArchitecture from './pages/SystemArchitecture';
// Assuming you have an Agent page for the actual Chat interface
import AgentChatPage from './pages/ChatBotPage'; 
import ResourceManagementPage from './pages/ResourceManagementPage';
import CompliancePage from './pages/CompliancePage';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Default Route: Redirect to Dashboard or Login */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* The main Data Source management page */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* The NEW Technical Flow/Architecture page you requested */}
        <Route path="/system-flow" element={<SystemArchitecture />} />

        {/* The actual AI Agent interface for Hybrid RAG queries */}
        <Route path="/agent" element={<AgentChatPage />} />

        {/* Placeholder routes for other Sidebar items */}
        <Route path="/resources" element={<ResourceManagementPage/>} />
        <Route path="/compliance" element={<CompliancePage/>} />

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

export default App;