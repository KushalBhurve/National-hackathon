import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/Dashboard';
import CompliancePage from './pages/CompliancePage';
import ChatbotPage from './pages/ChatBotPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. Default Route: Shows the Landing Page */}
        <Route path="/" element={<HomePage />} />
        
        {/* 2. Login Route */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* 3. Dashboard Route (Protected Area) */}
        <Route path="/dashboard" element={<DashboardPage />} />
        
        <Route path="/compliance" element={<CompliancePage />} />

        <Route path="/agent" element={<ChatbotPage />} />

        {/* Catch-all: Redirect unknown URLs back to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />




      </Routes>
    </Router>
  );
}

export default App;