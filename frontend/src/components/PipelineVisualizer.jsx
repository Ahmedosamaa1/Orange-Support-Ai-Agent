import React from 'react';
import AgentCard from './AgentCard';
import CitationCard from './CitationCard';
import { 
  Inbox, 
  Tag, 
  Search, 
  ShieldAlert, 
  MessageSquare, 
  CheckCheck, 
  SendHorizontal,
  Mail,
  Ticket,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function PipelineVisualizer({ pipelineState, isStreaming }) {
  const { t } = useLanguage();
  const state = pipelineState || {};
  const timeline = state.timeline || [];

  // Helper to extract status and data per step
  const getStepInfo = (stepName) => {
    const events = timeline.filter(e => e.step_name === stepName);
    if (!events.length) {
      if (isStreaming) {
        return { status: 'idle', duration: 0, data: null };
      }
      return { status: 'idle', duration: 0, data: null };
    }
    const last = events[events.length - 1];
    return {
      status: last.status === 'completed' ? 'completed' : (last.status === 'retrying' ? 'retrying' : 'completed'),
      duration: last.duration_ms,
      data: last.data
    };
  };

  const intake = getStepInfo('intake');
  const classifier = getStepInfo('classifier');
  const retrieval = getStepInfo('retrieval');
  const sentiment = getStepInfo('sentiment_risk');
  const response = getStepInfo('response');
  const qa = getStepInfo('qa');
  const action = getStepInfo('action');

  const citations = state.retrieval?.citations || [];
  const finalReply = state.response?.reply_text;
  const suggestedActions = state.response?.suggested_actions || [];
  const actionsData = state.actions || {};

  return (
    <div className="space-y-4">
      {/* Title & Live Indicator */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <span>{t.pipelineStatus}</span>
          {isStreaming && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
          )}
        </h3>

        {state.total_duration_ms > 0 && (
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
            Total: {state.total_duration_ms}ms
          </span>
        )}
      </div>

      {/* Agents Flow */}
      <div className="space-y-2.5">
        {/* 1. Intake */}
        <AgentCard
          title={lang === 'ar' ? "١. منسق الاستقبال (Intake Orchestrator)" : "1. Intake Orchestrator"}
          subtitle={lang === 'ar' ? "التحقق من صحة الطلب وفتح جلسة تتبع موحدة" : "Validates customer request & opens tracking session"}
          icon={Inbox}
          status={intake.status}
          durationMs={intake.duration}
          data={intake.data}
        />

        {/* 2. Classifier Agent */}
        <AgentCard
          title={lang === 'ar' ? "٢. وكيل التصنيف (Classifier Agent)" : "2. Classifier Agent"}
          subtitle={lang === 'ar' ? "تصنيف فئة المشكلة، درجة الأولوية، واللغة ومشاعر العميل" : "Classifies category, priority, language & sentiment"}
          icon={Tag}
          status={classifier.status}
          durationMs={classifier.duration}
          data={classifier.data}
          badge={classifier.data?.category?.toUpperCase()}
        />

        {/* 3. PARALLEL BRANCH (Retrieval & Risk) */}
        <div className="p-2.5 rounded-xl border border-dashed border-orange-300 dark:border-orange-900/50 bg-orange-50/10 dark:bg-orange-950/10 space-y-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-orange-600 dark:text-orange-400 flex items-center justify-between px-1">
            <span>{lang === 'ar' ? "⚡ تنفيذ متوازٍ فوري (Parallel Branch)" : "⚡ Parallel Concurrent Execution"}</span>
            <span>{lang === 'ar' ? "وكيلان يعملان بالتزامن" : "2 Agents In Sync"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <AgentCard
              title={lang === 'ar' ? "٣أ. وكيل الاسترجاع (RAG)" : "3a. Retrieval Agent (RAG)"}
              subtitle={lang === 'ar' ? "ملفات PDF + شيتات العملاء + API الشبكة" : "PDFs + Sheets + Outage API"}
              icon={Search}
              status={retrieval.status}
              durationMs={retrieval.duration}
              data={retrieval.data}
            />

            <AgentCard
              title={lang === 'ar' ? "٣ب. وكيل المخاطر (Sentiment & Risk)" : "3b. Sentiment & Risk Agent"}
              subtitle={lang === 'ar' ? "معدل الغضب واحتمالية فقد العميل وقرار التصعيد" : "Churn score & Escalation risk"}
              icon={ShieldAlert}
              status={sentiment.status}
              durationMs={sentiment.duration}
              data={sentiment.data}
              badge={sentiment.data?.churn_risk ? (lang === 'ar' ? `المخاطرة: ${sentiment.data.churn_risk}` : `Risk: ${sentiment.data.churn_risk}`) : null}
            />
          </div>
        </div>

        {/* 4. Response Agent */}
        <AgentCard
          title={lang === 'ar' ? "٤. وكيل الصياغة (Response Agent)" : "4. Response Agent"}
          subtitle={lang === 'ar' ? "صياغة الرد المعتمد والخطوات المقترحة عبر Gemini 2.0" : "Drafts native language response using verified context"}
          icon={MessageSquare}
          status={response.status}
          durationMs={response.duration}
          data={response.data}
        />

        {/* 5. QA Audit Agent (with Feedback Loop Indicator) */}
        <div className="relative">
          <AgentCard
            title={lang === 'ar' ? "٥. وكيل تدقيق الجودة (QA Audit Agent)" : "5. QA Audit Agent"}
            subtitle={lang === 'ar' ? "تدقيق صحة الحقائق، منع الهلوسة، والتأكد من مطابقة السياسات" : "Factual accuracy, policy limits & false promise audit"}
            icon={CheckCheck}
            status={qa.status}
            durationMs={qa.duration}
            data={qa.data}
            badge={qa.data?.passed ? (lang === 'ar' ? "معتمد 100%" : "PASSED 100%") : (qa.data ? (lang === 'ar' ? "إعادة تدقيق" : "RETRY") : null)}
          />
          {state.qa_retries > 0 && (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 px-2 font-medium">
              <RotateCcw className="w-3 h-3 animate-spin" />
              <span>{lang === 'ar' ? "تم تفعيل حلقة المراجعة الذاتية للـ QA: إعادة صياغة الرد" : "QA Revision Loop triggered: 1 loop applied"}</span>
            </div>
          )}
        </div>

        {/* 6. Action Agent */}
        <AgentCard
          title={lang === 'ar' ? "٦. وكيل الأتمتة (Action Agent)" : "6. Action Agent"}
          subtitle={lang === 'ar' ? "إرسال الإيميل، قيد التذكرة في النظام، وتحديث التقارير" : "Email outbox delivery, SQLite & Sheets sync, escalation alerts"}
          icon={SendHorizontal}
          status={action.status}
          durationMs={action.duration}
          data={action.data}
          badge={actionsData.escalated ? (lang === 'ar' ? "تصعيد لمشرف" : "ESCALATED") : (lang === 'ar' ? "تم الحل آلياً" : "RESOLVED")}
        />
      </div>

      {/* Results Section when Completed */}
      {finalReply && (
        <div className="mt-6 space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          
          {/* Escalation Alert Banner if applicable */}
          {actionsData.escalated && (
            <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-bold text-red-800 dark:text-red-300">
                  {t.escalatedBadge}
                </h4>
                <p className="text-red-700 dark:text-red-400 mt-0.5">
                  Reason: {actionsData.escalation_reason || "Critical priority trigger. Senior supervisor notified."}
                </p>
              </div>
            </div>
          )}

          {/* Final Reply Card */}
          <div className="rounded-xl border border-orange-500/40 bg-gradient-to-b from-orange-50/40 to-white dark:from-orange-950/20 dark:to-[#1E1E24] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                {t.finalReplyTitle}
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                QA Approved
              </span>
            </div>

            <p className="text-sm text-gray-800 dark:text-gray-100 font-sans leading-relaxed whitespace-pre-wrap">
              {finalReply}
            </p>

            {suggestedActions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-900/40">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                  {t.suggestedActions}:
                </span>
                <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
                  {suggestedActions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Automated Actions Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24] flex items-center gap-2.5">
              <Ticket className="w-4 h-4 text-orange-500" />
              <div>
                <span className="text-gray-500 dark:text-gray-400 block text-[11px]">{t.ticketCreated}</span>
                <span className="font-bold font-mono text-gray-800 dark:text-gray-200">{state.ticket_id}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24] flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-emerald-500" />
              <div>
                <span className="text-gray-500 dark:text-gray-400 block text-[11px]">{t.emailDispatched}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{actionsData.email_recipient || "Delivered to outbox"}</span>
              </div>
            </div>
          </div>

          {/* Citations List */}
          {citations.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t.citationsTitle} ({citations.length})
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {citations.map((cite, idx) => (
                  <CitationCard key={idx} citation={cite} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
