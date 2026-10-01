import React from 'react';
import { 
  Inbox, 
  Tag, 
  Search, 
  ShieldAlert, 
  MessageSquare, 
  CheckCheck, 
  SendHorizontal,
  RotateCcw,
  ArrowRight,
  Database,
  FileText,
  Activity
} from 'lucide-react';

export default function ArchitectureDiagram({ activeStep = null }) {
  const nodes = [
    { id: 'intake', label: '1. Customer Intake', sub: 'Input Validation', icon: Inbox, color: 'blue' },
    { id: 'classifier', label: '2. Classifier Agent', sub: 'Category & Sentiment', icon: Tag, color: 'orange' },
    { 
      id: 'parallel', 
      label: '3. Concurrent Branch', 
      sub: 'Parallel Execution', 
      isParallel: true,
      children: [
        { id: 'retrieval', label: '3a. Retrieval Agent', sub: 'RAG (PDF) + Sheets + API', icon: Search },
        { id: 'sentiment_risk', label: '3b. Sentiment & Risk', sub: 'Churn & Escalation Analysis', icon: ShieldAlert }
      ]
    },
    { id: 'response', label: '4. Response Agent', sub: 'Bilingual Generation', icon: MessageSquare, color: 'purple' },
    { id: 'qa', label: '5. QA Audit Agent', sub: 'Fact & Tone Verification', icon: CheckCheck, color: 'emerald', hasLoop: true },
    { id: 'action', label: '6. Action Agent', sub: 'Tickets, Email & Escalations', icon: SendHorizontal, color: 'amber' }
  ];

  const isActive = (id) => activeStep === id;

  return (
    <div className="w-full bg-white dark:bg-[#18181D] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm overflow-hidden">
      
      {/* Diagram Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>LangGraph Multi-Agent Orchestration Flow</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-[#FF7900] font-mono">
              v1.0 DAG
            </span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Sequential pipeline with parallel fan-out and conditional QA revision loop
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Standard Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
            <span>Active Step</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Loopback Edge</span>
          </div>
        </div>
      </div>

      {/* Nodes Flow Representation */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-stretch relative">
        
        {/* Node 1: Intake */}
        <div className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
          isActive('intake')
            ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/30'
            : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40'
        }`}>
          <div>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              <Inbox className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white">1. Intake</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Payload Sanitization & Session Init</p>
          </div>
          <div className="mt-3 text-[10px] font-mono text-gray-400">Entrypoint</div>
        </div>

        {/* Node 2: Classifier */}
        <div className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
          isActive('classifier')
            ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/30'
            : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40'
        }`}>
          <div>
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-[#FF7900] flex items-center justify-center mb-3">
              <Tag className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white">2. Classifier</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Intent, Priority & Sentiment JSON</p>
          </div>
          <div className="mt-3 text-[10px] font-mono text-orange-500">Pydantic LLM</div>
        </div>

        {/* Node 3: PARALLEL BRANCH (Colspan 2) */}
        <div className={`md:col-span-2 p-3.5 rounded-xl border border-dashed transition-all duration-300 ${
          isActive('retrieval') || isActive('sentiment_risk') || isActive('retrieval_and_sentiment')
            ? 'border-orange-500 bg-orange-500/10'
            : 'border-orange-300 dark:border-orange-900/60 bg-orange-50/20 dark:bg-orange-950/10'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              ⚡ Parallel Concurrent Branch
            </span>
            <span className="text-[10px] font-mono text-gray-400">asyncio.gather</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* 3a */}
            <div className={`p-2.5 rounded-lg border bg-white dark:bg-gray-800/80 ${
              isActive('retrieval') ? 'border-orange-500 shadow-sm' : 'border-gray-200 dark:border-gray-700/60'
            }`}>
              <div className="flex items-center gap-1.5 mb-1 text-orange-500">
                <Search className="w-3.5 h-3.5" />
                <span className="text-xs font-bold text-gray-900 dark:text-white">3a. RAG Search</span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">PDFs + Sheets + API</p>
            </div>

            {/* 3b */}
            <div className={`p-2.5 rounded-lg border bg-white dark:bg-gray-800/80 ${
              isActive('sentiment_risk') ? 'border-orange-500 shadow-sm' : 'border-gray-200 dark:border-gray-700/60'
            }`}>
              <div className="flex items-center gap-1.5 mb-1 text-red-500">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="text-xs font-bold text-gray-900 dark:text-white">3b. Risk Agent</span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Churn & Escalation</p>
            </div>
          </div>
        </div>

        {/* Node 4: Response Agent */}
        <div className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
          isActive('response')
            ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/30'
            : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40'
        }`}>
          <div>
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white">4. Response</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Grounding with context facts</p>
          </div>
          <div className="mt-3 text-[10px] font-mono text-purple-500">Ar / En Native</div>
        </div>

        {/* Node 5: QA Agent */}
        <div className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between relative ${
          isActive('qa')
            ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/30'
            : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40'
        }`}>
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <CheckCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white">5. QA Audit</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">SLA & Truth Verification</p>
          </div>
          
          {/* Feedback loop tag */}
          <div className="mt-3 flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Retries if Fail</span>
          </div>
        </div>

      </div>

      {/* Action Agent & Output Destinations */}
      <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Node 6: Action Agent */}
        <div className={`w-full md:w-auto p-4 rounded-xl border flex items-center gap-3 transition-all ${
          isActive('action')
            ? 'border-orange-500 bg-orange-500/10'
            : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40'
        }`}>
          <div className="w-9 h-9 rounded-lg bg-[#FF7900] text-white flex items-center justify-center shrink-0">
            <SendHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white">6. Action Agent (Automations)</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Dispatches side-effects based on validated QA verdict</p>
          </div>
        </div>

        {/* 3 Output Side-effects */}
        <div className="grid grid-cols-3 gap-2 w-full md:w-auto text-center text-xs">
          <div className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24]">
            <span className="font-bold text-orange-500 block">Outbox .EML</span>
            <span className="text-[10px] text-gray-400">Customer Email</span>
          </div>
          <div className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24]">
            <span className="font-bold text-blue-500 block">SQLite & Sheets</span>
            <span className="text-[10px] text-gray-400">Ticket Records</span>
          </div>
          <div className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24]">
            <span className="font-bold text-red-500 block">Supervisor Alert</span>
            <span className="text-[10px] text-gray-400">Auto-Escalation</span>
          </div>
        </div>

      </div>

    </div>
  );
}
