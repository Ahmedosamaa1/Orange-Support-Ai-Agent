import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchKnowledgeBase, reindexKnowledgeBase } from '../services/api';
import { 
  FileText, 
  Database, 
  RotateCw, 
  CheckCircle, 
  Layers, 
  Mail, 
  Server,
  FolderOpen
} from 'lucide-react';

export default function KnowledgeBase() {
  const { t } = useLanguage();

  const [kbData, setKbData] = useState(null);
  const [reindexing, setReindexing] = useState(false);
  const [reindexSuccess, setReindexSuccess] = useState(false);

  const loadKb = async () => {
    try {
      const data = await fetchKnowledgeBase();
      setKbData(data);
    } catch (e) {
      console.error('Failed to load KB data:', e);
    }
  };

  useEffect(() => {
    loadKb();
  }, []);

  const handleReindex = async () => {
    try {
      setReindexing(true);
      setReindexSuccess(false);
      await reindexKnowledgeBase();
      await loadKb();
      setReindexSuccess(true);
      setTimeout(() => setReindexSuccess(false), 4000);
    } catch (e) {
      console.error('Reindexing failed:', e);
    } finally {
      setReindexing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* KB Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {t.navKB}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Multi-source intelligence: RAG indexed PDFs, Google Sheets/CSV customer accounts, and Outbox files
          </p>
        </div>

        <button
          onClick={handleReindex}
          disabled={reindexing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF7900] hover:bg-[#E06000] text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin' : ''}`} />
          <span>{reindexing ? "Re-indexing..." : t.reindexBtn}</span>
        </button>
      </div>

      {/* Success banner */}
      {reindexSuccess && (
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Knowledge base and vector store successfully re-indexed!</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* PDF Documents */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold block uppercase">Indexed PDF Manuals</span>
            <span className="text-2xl font-extrabold text-gray-900 dark:text-white font-mono">
              {kbData?.pdfs?.length ?? 2} Files
            </span>
          </div>
        </div>

        {/* Vector Chunks */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold block uppercase">RAG Vector Chunks</span>
            <span className="text-2xl font-extrabold text-blue-500 font-mono">
              {kbData?.total_chunks ?? 8} Chunks
            </span>
          </div>
        </div>

        {/* Outbox Mails */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-500 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold block uppercase">Outbox Dispatched Emails</span>
            <span className="text-2xl font-extrabold text-purple-500 font-mono">
              {kbData?.outbox_emails_count ?? 0} .EML Files
            </span>
          </div>
        </div>

      </div>

      {/* Documents Breakdown Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Source 1: PDFs */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              1. Telecom Knowledge Base PDFs
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Official policy and catalog documents parsed into RAG chunks with PyMuPDF:
          </p>

          <div className="space-y-2.5">
            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/80 text-orange-500 flex items-center justify-center font-bold text-xs">
                  PDF
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">telecom_plans_pricing.pdf</h4>
                  <span className="text-[11px] text-gray-400">Home DSL (140GB, 250GB, 400GB) & GO Bundles</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600">Active</span>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/80 text-orange-500 flex items-center justify-center font-bold text-xs">
                  PDF
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">support_sla_policies.pdf</h4>
                  <span className="text-[11px] text-gray-400">Router troubleshooting steps, SLA timelines, refund policy</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600">Active</span>
            </div>
          </div>
        </div>

        {/* Source 2: Sheets & Tables */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              2. Google Sheets / Local CSV Fallback
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Real-time customer account balances, quota metrics, and dynamic FAQ rows:
          </p>

          <div className="space-y-2.5">
            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-500 flex items-center justify-center font-bold text-xs">
                  CSV
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">customers.csv</h4>
                  <span className="text-[11px] text-gray-400">Subscriber plans, balances, usage quotas & charges</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600">Synchronized</span>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-500 flex items-center justify-center font-bold text-xs">
                  CSV
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">faqs.csv</h4>
                  <span className="text-[11px] text-gray-400">Frequently Asked Questions & rapid answers</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600">Synchronized</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
