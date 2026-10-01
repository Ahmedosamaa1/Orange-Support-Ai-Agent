import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';

export default function AgentCard({
  title,
  subtitle,
  icon: Icon,
  status = 'idle', // 'idle' | 'running' | 'completed' | 'retrying' | 'failed'
  durationMs = 0,
  data = null,
  badge = null
}) {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const statusConfig = {
    idle: {
      border: 'border-gray-200 dark:border-gray-800',
      bg: 'bg-white dark:bg-[#1E1E24]',
      badge: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
      label: lang === 'ar' ? 'في الانتظار' : 'Idle',
      icon: Clock
    },
    running: {
      border: 'border-orange-500 shadow-md shadow-orange-500/10 ring-1 ring-orange-500/30',
      bg: 'bg-orange-50/30 dark:bg-orange-950/20',
      badge: 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-semibold animate-pulse',
      label: lang === 'ar' ? 'جاري المعالجة...' : 'Running...',
      icon: Loader2
    },
    completed: {
      border: 'border-emerald-500/40 dark:border-emerald-500/30',
      bg: 'bg-white dark:bg-[#1E1E24]',
      badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60',
      label: lang === 'ar' ? 'مكتمل بنجاح' : 'Completed',
      icon: CheckCircle
    },
    retrying: {
      border: 'border-amber-500/50',
      bg: 'bg-amber-50/20 dark:bg-amber-950/20',
      badge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold animate-bounce',
      label: lang === 'ar' ? 'إعادة صياغة QA' : 'QA Revision',
      icon: AlertTriangle
    }
  };

  const current = statusConfig[status] || statusConfig.idle;
  const StatusIcon = current.icon;

  return (
    <div className={`rounded-xl border ${current.border} ${current.bg} transition-all duration-200 overflow-hidden`}>
      <div 
        onClick={() => data && setIsOpen(!isOpen)}
        className={`p-3.5 flex items-center justify-between gap-3 ${data ? 'cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30' : ''}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            status === 'completed' 
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              : status === 'running'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}>
            <Icon className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">{title}</h4>
              {badge && (
                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {durationMs > 0 && (
            <span className="text-[11px] font-mono font-medium text-gray-400 dark:text-gray-500">
              {durationMs}ms
            </span>
          )}

          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${current.badge}`}>
            <StatusIcon className={`w-3 h-3 ${status === 'running' ? 'animate-spin' : ''}`} />
            <span>{current.label}</span>
          </span>

          {data && (
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable JSON Output */}
      {isOpen && data && (
        <div className="border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/80 dark:bg-[#151518] p-3 text-[11px] font-mono text-gray-700 dark:text-gray-300 overflow-x-auto max-h-56">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
