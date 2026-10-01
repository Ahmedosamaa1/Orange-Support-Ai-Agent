import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121214] py-6 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Orange Smart Support</span>
          <span>&bull;</span>
          <span>Multi-Agent AI Final Project</span>
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 text-[11px] text-gray-600 dark:text-gray-300 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
          <span>{t.disclaimer}</span>
        </div>

        <div>
          <span>&copy; {new Date().getFullYear()} AI Agents Engineering.</span>
        </div>
      </div>
    </footer>
  );
}
