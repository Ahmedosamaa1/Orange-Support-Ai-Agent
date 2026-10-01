import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ArchitectureDiagram from '../components/ArchitectureDiagram';
import { 
  GitFork, 
  RotateCcw, 
  Search, 
  ShieldCheck, 
  Cpu, 
  FileCode,
  Layers,
  Sparkles
} from 'lucide-react';

export default function HowItWorks() {
  const { t } = useLanguage();

  const workflowSteps = [
    {
      num: "01",
      title: "Intake & Session Initiation",
      desc: "Sanitizes customer input, assigns a unique tracking Ticket ID, extracts subscriber telephone and account numbers, and initializes the LangGraph AgentState TypedDict.",
      tech: "FastAPI + Pydantic"
    },
    {
      num: "02",
      title: "Cognitive Classification",
      desc: "Analyzes the query using Google Gemini to produce a validated JSON payload containing the category (technical, billing, plan inquiry, service request, other), urgency priority, language (Arabic/English), and sentiment.",
      tech: "Gemini 2.0 Flash + Structured Schema"
    },
    {
      num: "03",
      title: "Parallel Branch: Multi-Source RAG & Risk Assessment",
      desc: "Executes concurrently via asyncio.gather: The Retrieval Agent extracts semantically relevant sections from PyMuPDF-parsed PDF manuals, checks Google Sheets account balances, and queries regional network status APIs. Concurrently, the Risk Agent estimates subscriber churn risk and supervisor escalation requirements.",
      tech: "PyMuPDF + Cosine Vector Retrieval + Google Sheets API"
    },
    {
      num: "04",
      title: "Grounded Response Formulation",
      desc: "Drafts a courteous, brand-aligned resolution message in the subscriber's native language. Grounded exclusively on verified knowledge citations without hallucinated promotions or commitments.",
      tech: "Context-Conditioned Prompting"
    },
    {
      num: "05",
      title: "QA Audit & Self-Correction Feedback Loop",
      desc: "An independent auditor agent inspects the response for factual precision, SLA compliance, and tone. If the response fails, LangGraph activates a conditional edge to loop back to the Response Agent with targeted feedback (up to 2 retries).",
      tech: "LangGraph Conditional Routing + Self-Correction"
    },
    {
      num: "06",
      title: "Downstream Action Orchestration",
      desc: "Dispatches customer email confirmations (dry-run RFC 822 .eml/.html in /outbox or live SMTP), updates the local SQLite database, appends rows to Google Sheets, and triggers instant alerts for senior supervisors upon escalation triggers.",
      tech: "SQLite + gspread + SMTP Outbox"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#FF7900] text-xs font-semibold">
          <Layers className="w-3.5 h-3.5" />
          <span>System Architecture & LangGraph Design</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
          Under the Hood: Multi-Agent AI System
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          An enterprise-grade customer support platform coordinating autonomous agents through deterministic state machine pipelines and feedback loops.
        </p>
      </div>

      {/* Visual Diagram */}
      <ArchitectureDiagram />

      {/* Deep-Dive Steps */}
      <div className="space-y-6 pt-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileCode className="w-5 h-5 text-orange-500" />
          <span>Detailed Pipeline Execution Mechanics</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workflowSteps.map((st, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24] shadow-sm space-y-3 hover:border-orange-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-[#FF7900] font-mono opacity-80">{st.num}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {st.tech}
                </span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                {st.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Highlights Callout */}
      <div className="p-6 rounded-2xl border border-orange-200 dark:border-orange-900/60 bg-gradient-to-r from-orange-50/50 to-amber-50/30 dark:from-orange-950/20 dark:to-[#1E1E24] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <span>Guaranteed Reliability & Safe Demoware</span>
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
            Designed with comprehensive fallback mechanisms: If Gemini API limits or credentials are not configured, the system automatically activates a domain-accurate Mock LLM mode, ensuring zero crashes and seamless demonstrations.
          </p>
        </div>
      </div>

    </div>
  );
}
