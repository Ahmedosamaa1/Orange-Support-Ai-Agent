import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import LiveConsole from './pages/LiveConsole';
import Dashboard from './pages/Dashboard';
import KnowledgeBase from './pages/KnowledgeBase';
import Evaluation from './pages/Evaluation';
import HowItWorks from './pages/HowItWorks';
import { checkHealth } from './services/api';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const [systemInfo, setSystemInfo] = useState(null);

  useEffect(() => {
    checkHealth()
      .then(info => setSystemInfo(info))
      .catch(err => console.log('Backend offline or starting up:', err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-[#121214] dark:text-gray-100 font-sans transition-colors duration-200">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        systemInfo={systemInfo} 
      />

      <main className="flex-1">
        {activeTab === 'home' && <Home setActiveTab={setActiveTab} />}
        {activeTab === 'console' && <LiveConsole />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'kb' && <KnowledgeBase />}
        {activeTab === 'evaluation' && <Evaluation />}
        {activeTab === 'how-it-works' && <HowItWorks />}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
