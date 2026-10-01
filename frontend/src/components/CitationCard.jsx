import React from 'react';
import { FileText, Database, Activity, ExternalLink } from 'lucide-react';

export default function CitationCard({ citation }) {
  const isPdf = citation.source_type === 'pdf_kb';
  const isSheet = citation.source_type === 'google_sheets_csv';
  const isApi = citation.source_type === 'network_api';

  const badgeConfig = isPdf
    ? { label: 'PDF Knowledge Base', bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', icon: FileText }
    : isSheet
    ? { label: 'Google Sheets / Accounts', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', icon: Database }
    : { label: 'Network Health REST API', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', icon: Activity };

  const Icon = badgeConfig.icon;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24] p-3.5 shadow-sm hover:border-orange-500/50 transition-all">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badgeConfig.bg} ${badgeConfig.text} ${badgeConfig.border}`}>
          <Icon className="w-3 h-3" />
          {badgeConfig.label}
        </span>
        <span className="text-[11px] font-mono text-gray-400">
          Match: {Math.round((citation.confidence || 0.95) * 100)}%
        </span>
      </div>

      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5 line-clamp-1 flex items-center justify-between">
        <span>{citation.source_title}</span>
      </h4>

      <p className="text-xs text-gray-600 dark:text-gray-300 font-sans leading-relaxed bg-gray-50 dark:bg-gray-900/60 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800/80">
        "{citation.snippet}"
      </p>
    </div>
  );
}
