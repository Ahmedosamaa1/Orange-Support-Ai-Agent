import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Home, 
  Terminal, 
  LayoutDashboard, 
  BookOpen, 
  CheckSquare, 
  Workflow, 
  Globe, 
  Sun, 
  Moon, 
  Zap 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, systemInfo }) {
  const { lang, toggleLanguage, theme, toggleTheme, t } = useLanguage();

  const navItems = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'console', label: t.navLiveConsole, icon: Terminal },
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'kb', label: t.navKB, icon: BookOpen },
    { id: 'evaluation', label: t.navEvaluation, icon: CheckSquare },
    { id: 'how-it-works', label: t.navHowItWorks, icon: Workflow },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-2xl border-b border-gray-200/80 dark:border-gray-800/80 bg-white/95 dark:bg-[#0B0B0F]/95 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4 flex-nowrap">
        
        {/* 1. Brand Logo & Name (Sharp official Orange square with generous spacing) */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-4 cursor-pointer group shrink-0"
        >
          <img 
            src="/orange-vector.svg" 
            alt="Orange" 
            className="h-10 w-10 object-contain shadow-sm shrink-0 group-hover:scale-105 transition-transform" 
          />
          <div dir="ltr" className="flex items-center whitespace-nowrap">
            <span className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white tracking-tight leading-none">
              Orange <span className="text-[#FF7900]">Support</span>
            </span>
          </div>
        </div>

        {/* 2. Center Capsule Navbar (Single Line, Never Wraps, Exact Reference Layout) */}
        <nav className="hidden lg:flex items-center flex-nowrap gap-1 bg-gray-100/90 dark:bg-[#14141B] border border-gray-200/90 dark:border-gray-800 p-1.5 rounded-full shadow-lg shadow-black/10 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FF7900] to-[#FFA034] text-white shadow-md shadow-orange-500/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 3. Controls & Action Button (Clean, Non-crammed) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-nowrap">
          
          {/* Main Glowing Action Button (Like Discord Button in Reference) */}
          <button
            onClick={() => setActiveTab('console')}
            className="whitespace-nowrap hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#FF7900] to-[#E06000] hover:from-[#E06000] hover:to-[#C25000] text-white text-xs font-extrabold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all shrink-0"
          >
            <Zap className="w-3.5 h-3.5 fill-white shrink-0" />
            <span className="whitespace-nowrap">{lang === 'ar' ? 'بدء التجربة Live' : 'Live Console'}</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            title="Toggle Arabic / English"
            className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#14141B] text-gray-700 dark:text-gray-200 hover:border-[#FF7900] hover:text-[#FF7900] shadow-sm transition-all shrink-0"
          >
            <Globe className="w-3.5 h-3.5 text-[#FF7900] shrink-0" />
            <span className="whitespace-nowrap">{t.langToggle}</span>
          </button>

          {/* Dark/Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#14141B] text-gray-700 dark:text-gray-200 hover:text-[#FF7900] hover:border-[#FF7900] shadow-sm transition-all shrink-0"
            title="Toggle Light / Dark"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

        </div>

      </div>

      {/* Mobile Navigation Scrollbar */}
      <div className="lg:hidden flex overflow-x-auto px-4 py-2 border-t border-gray-200 dark:border-gray-800/80 gap-1.5 bg-gray-50 dark:bg-[#0E0E14] scrollbar-none flex-nowrap">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-[#FF7900] text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
