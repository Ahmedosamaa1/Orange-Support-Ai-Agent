import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  ArrowRight, 
  Cpu, 
  Tag, 
  Search, 
  ShieldAlert, 
  MessageSquare, 
  CheckCheck, 
  Zap, 
  Sparkles,
  ShieldCheck,
  Clock,
  Database,
  Layers,
  Bot
} from 'lucide-react';

export default function Home({ setActiveTab }) {
  const { t, lang } = useLanguage();

  const agents = [
    {
      id: 'classifier',
      title: t.agentClassifier,
      desc: t.agentClassifierDesc,
      icon: Tag,
      color: "from-orange-500/20 to-amber-500/10",
      accent: "text-[#FF7900]",
      border: "hover:border-orange-500/60",
      glow: "hover:shadow-orange-500/10",
      badge: lang === 'ar' ? 'تصنيف فوري' : 'Real-time',
      tech: ['Gemini 2.0 Flash', 'Pydantic', 'Sentiment']
    },
    {
      id: 'retrieval',
      title: t.agentRetrieval,
      desc: t.agentRetrievalDesc,
      icon: Search,
      color: "from-blue-500/20 to-cyan-500/10",
      accent: "text-blue-500",
      border: "hover:border-blue-500/60",
      glow: "hover:shadow-blue-500/10",
      badge: lang === 'ar' ? 'بحث هجين' : 'Hybrid RAG',
      tech: ['PyMuPDF RAG', 'Google Sheets', 'REST API']
    },
    {
      id: 'risk',
      title: t.agentRisk,
      desc: t.agentRiskDesc,
      icon: ShieldAlert,
      color: "from-red-500/20 to-pink-500/10",
      accent: "text-red-500",
      border: "hover:border-red-500/60",
      glow: "hover:shadow-red-500/10",
      badge: lang === 'ar' ? 'حماية العميل' : 'Churn Guard',
      tech: ['Parallel Branch', 'Auto Escalation', 'Supervisor Alert']
    },
    {
      id: 'response',
      title: t.agentResponse,
      desc: t.agentResponseDesc,
      icon: MessageSquare,
      color: "from-purple-500/20 to-indigo-500/10",
      accent: "text-purple-500",
      border: "hover:border-purple-500/60",
      glow: "hover:shadow-purple-500/10",
      badge: lang === 'ar' ? 'صياغة معتمدة' : 'Verified Draft',
      tech: ['Multi-lingual', 'SLA Policy', 'Zero Hallucination']
    },
    {
      id: 'qa',
      title: t.agentQA,
      desc: t.agentQADesc,
      icon: CheckCheck,
      color: "from-emerald-500/20 to-teal-500/10",
      accent: "text-emerald-500",
      border: "hover:border-emerald-500/60",
      glow: "hover:shadow-emerald-500/10",
      badge: lang === 'ar' ? 'حلقة تدقيق' : 'Feedback Loop',
      tech: ['Self-Correction', 'Fact Verification', 'Retry DAG']
    },
    {
      id: 'action',
      title: t.agentAction,
      desc: t.agentActionDesc,
      icon: Zap,
      color: "from-amber-500/20 to-yellow-500/10",
      accent: "text-amber-500",
      border: "hover:border-amber-500/60",
      glow: "hover:shadow-amber-500/10",
      badge: lang === 'ar' ? 'أتمتة شاملة' : 'Autonomous',
      tech: ['SMTP Dispatch', 'SQLite Sync', 'Daily Reports']
    }
  ];

  return (
    <div className="space-y-16 pb-12">
      
      {/* Hero Section */}
      <section className="relative isolate text-center pt-4 sm:pt-6 pb-12 sm:pb-16 px-4 max-w-5xl mx-auto space-y-7 overflow-hidden">
        
        {/* Subtle Top Luminous Horizon Divider */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"></div>

        {/* Background Ambience: Tech Grid & Ambient Orange Glow */}
        <div className="absolute inset-0 pointer-events-none select-none -z-10 overflow-hidden">
          {/* Subtle Orange Tech Dot Grid */}
          <div 
            className="absolute inset-0 opacity-[0.15] dark:opacity-[0.25]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,121,0,0.45) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              maskImage: 'radial-gradient(ellipse 75% 55% at 50% 35%, black 20%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 75% 55% at 50% 35%, black 20%, transparent 80%)'
            }}
          />

          {/* Warm Ambient Orange Aurora Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-orange-500/15 dark:bg-orange-600/20 rounded-full blur-[110px]"></div>
        </div>

        {/* Top Tech Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-xs font-semibold shadow-[0_0_20px_rgba(255,121,0,0.12)] backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF7900]"></span>
          </span>
          <span>{lang === 'ar' ? "ابتكار ريادي لخدمة عملاء أورنج • الذكاء الاصطناعي متعدد الوكلاء" : "Next-Gen Telecom AI Startup • Autonomous Multi-Agent Resolution"}</span>
        </div>

        {/* Dynamic Bilingual Headline */}
        <div className="space-y-3 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 dark:text-white leading-[1.25]">
            {lang === 'ar' ? (
              <>
                منصة <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7900] via-orange-400 to-amber-400">أورنج للرد الذكي</span>
              </>
            ) : (
              <>
                Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7900] via-orange-400 to-amber-400">Orange Autonomous Support</span>
              </>
            )}
          </h1>
          <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-800 dark:text-gray-200">
            {lang === 'ar' ? "حل استفسارات وشكاوى العملاء بالكامل عبر الذكاء الاصطناعي" : "End-to-End Telecom Resolution via Autonomous AI Swarm"}
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed font-sans">
          {t.heroSubtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
          <button
            onClick={() => setActiveTab('console')}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#FF7900] to-orange-600 hover:from-orange-500 hover:to-[#FF7900] text-white font-bold text-sm sm:text-base shadow-xl shadow-orange-500/25 hover:shadow-orange-500/45 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <span>{t.tryAgent}</span>
            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          </button>

          <button
            onClick={() => setActiveTab('how-it-works')}
            className="flex items-center gap-2 px-7 py-4 rounded-2xl border border-gray-300 dark:border-gray-700/80 bg-white dark:bg-[#18181F]/90 hover:bg-gray-50 dark:hover:bg-[#202028] text-gray-800 dark:text-gray-200 font-bold text-sm sm:text-base shadow-sm hover:-translate-y-0.5 transition-all duration-200"
          >
            <Layers className="w-4 h-4 text-[#FF7900]" />
            <span>{t.viewArchitecture}</span>
          </button>
        </div>

        {/* Live Interactive Agent Pipeline Showcase Card */}
        <div className="pt-6 max-w-4xl mx-auto">
          <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#16161B]/90 backdrop-blur-xl shadow-2xl p-5 sm:p-6 text-start space-y-4 relative overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 ms-2">
                  orange-agent-pipeline.dag // LangGraph + Gemini 2.0
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{lang === 'ar' ? 'نظام الوكلاء نشط ومستعد' : 'Agent Swarm Online'}</span>
              </div>
            </div>

            {/* Simulated Live Inquiry */}
            <div className="p-3.5 rounded-2xl bg-gray-100 dark:bg-[#1D1D24] border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-[#FF7900] flex items-center justify-center font-bold text-xs shrink-0">
                  MSG
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 font-sans">
                  {lang === 'ar' 
                    ? '📩 استفسار العميل: "الباقة الشهرية خلصت بسرعة والسرعة بطيئة، ومحتاج أعرف استهلاكي وتفاصيل باقة الـ 140GB"'
                    : '📩 Customer Inquiry: "My monthly data quota finished early, speed is throttled. Need my usage details and Home DSL 140GB pricing."'}
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('console')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FF7900] hover:bg-[#E06000] text-white text-xs font-bold transition-all shrink-0 shadow-sm"
              >
                <span>{lang === 'ar' ? 'تشغيل حي' : 'Run Live'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>

            {/* 4 Agent Step Chips */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl border border-orange-500/30 bg-orange-500/5 dark:bg-orange-950/20 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-orange-500">
                  <span>{lang === 'ar' ? '١. وكيل التصنيف' : '1. Classifier'}</span>
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">
                  {lang === 'ar' ? 'فئة: استفسار باقات • أولوية: عادية' : 'Category: Plans • Priority: Normal'}
                </div>
              </div>

              <div className="p-3 rounded-2xl border border-blue-500/30 bg-blue-500/5 dark:bg-blue-950/20 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-blue-500">
                  <span>{lang === 'ar' ? '٢. وكيل الاسترجاع' : '2. RAG Retrieval'}</span>
                  <Search className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">
                  {lang === 'ar' ? 'فحص شيت العميل + PDF الباقات' : 'Parsed Sheets + PDF Pricing'}
                </div>
              </div>

              <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-500">
                  <span>{lang === 'ar' ? '٣. تدقيق الجودة' : '3. QA Loop'}</span>
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">
                  {lang === 'ar' ? 'اجتياز الجودة: 100% بدون تزييف' : 'Pass Rate: 100% Verified'}
                </div>
              </div>

              <div className="p-3 rounded-2xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/20 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-purple-500">
                  <span>{lang === 'ar' ? '٤. وكيل الإجراءات' : '4. Action Agent'}</span>
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">
                  {lang === 'ar' ? 'إرسال إيميل بالحل + حفظ التذكرة' : 'Sent Email + Ticket Logged'}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Redesigned Premium Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 pt-6">
          
          {/* Stat 1: Latency */}
          <div className="group relative p-5 sm:p-6 rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-[#16161F]/90 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:border-blue-500/50 hover:-translate-y-1 transition-all duration-300 text-center space-y-2.5 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/60 to-transparent group-hover:via-blue-400 transition-all"></div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-950/60 border border-blue-500/20 text-blue-500 flex items-center justify-center mx-auto shadow-inner group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div dir="ltr" className="text-3xl sm:text-4xl font-black text-blue-500 font-mono tracking-tight">
              &lt; 2.5s
            </div>
            <div className="text-xs font-bold text-gray-700 dark:text-gray-200">
              {lang === 'ar' ? 'متوسط سرعة الاستجابة' : 'Avg Response Latency'}
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
              {lang === 'ar' ? '⚡ أسرع بـ 8x من البشر' : '⚡ 8x Faster than SLA'}
            </div>
          </div>

          {/* Stat 2: QA Pass Rate */}
          <div className="group relative p-5 sm:p-6 rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-[#16161F]/90 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:border-emerald-500/50 hover:-translate-y-1 transition-all duration-300 text-center space-y-2.5 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent group-hover:via-emerald-400 transition-all"></div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-inner group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div dir="ltr" className="text-3xl sm:text-4xl font-black text-emerald-500 font-mono tracking-tight">
              100%
            </div>
            <div className="text-xs font-bold text-gray-700 dark:text-gray-200">
              {lang === 'ar' ? 'اجتياز تدقيق الـ QA' : 'QA Audit Verification'}
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
              {lang === 'ar' ? '🛡️ منعدم الهلوسة والتزييف' : '🛡️ Zero Hallucinations'}
            </div>
          </div>

          {/* Stat 3: Retrieval Sources */}
          <div className="group relative p-5 sm:p-6 rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-[#16161F]/90 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:border-orange-500/50 hover:-translate-y-1 transition-all duration-300 text-center space-y-2.5 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF7900]/60 to-transparent group-hover:via-[#FF7900] transition-all"></div>
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-950/60 border border-orange-500/20 text-[#FF7900] flex items-center justify-center mx-auto shadow-inner group-hover:scale-110 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <div dir="ltr" className="text-3xl sm:text-4xl font-black text-[#FF7900] font-mono tracking-tight">
              3
            </div>
            <div className="text-xs font-bold text-gray-700 dark:text-gray-200">
              {lang === 'ar' ? 'مصادر استرجاع RAG' : 'Data Retrieval Sources'}
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-semibold">
              {lang === 'ar' ? '📚 PDF + Sheets + API' : '📚 PDF + Sheets + API'}
            </div>
          </div>

          {/* Stat 4: AI Agents */}
          <div className="group relative p-5 sm:p-6 rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-[#16161F]/90 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:border-purple-500/50 hover:-translate-y-1 transition-all duration-300 text-center space-y-2.5 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent group-hover:via-purple-400 transition-all"></div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-purple-950/60 border border-purple-500/20 text-purple-500 flex items-center justify-center mx-auto shadow-inner group-hover:scale-110 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div dir="ltr" className="text-3xl sm:text-4xl font-black text-purple-500 font-mono tracking-tight">
              6
            </div>
            <div className="text-xs font-bold text-gray-700 dark:text-gray-200">
              {lang === 'ar' ? 'وكلاء ذكاء اصطناعي' : 'Specialized AI Agents'}
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-semibold">
              {lang === 'ar' ? '🤖 معمارية LangGraph' : '🤖 LangGraph Swarm'}
            </div>
          </div>

        </div>

      </section>

      {/* Feature Grid: Specialized AI Agents Swarm */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#FF7900] text-xs font-bold shadow-sm">
            <Cpu className="w-4 h-4 animate-spin-slow" />
            <span>{lang === 'ar' ? 'معمارية شبكة الوكلاء الذاتية' : 'Autonomous Agent Architecture'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            {t.featureTitle}
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-sans leading-relaxed">
            {lang === 'ar' 
              ? 'كل وكيل يؤدي وظيفة إدراكية متخصصة ومقيدة بحقائق موثقة ضمن مخطط LangGraph، لضمان حل المشكلات بدقة وسرعة فائقة.'
              : 'Each agent fulfills a distinct cognitive role within the LangGraph DAG, collaborating seamlessly to resolve subscriber inquiries with zero hallucination.'}
          </p>
        </div>

        {/* 6 Upgraded Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((ag) => {
            const Icon = ag.icon;
            return (
              <div
                key={ag.id}
                className={`p-6 sm:p-7 rounded-3xl border border-gray-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-[#15151D]/90 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 ${ag.border} ${ag.glow} group relative overflow-hidden flex flex-col justify-between`}
              >
                {/* Top Ambient Glow on Card Hover */}
                <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-br ${ag.color} rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                <div className="space-y-4">
                  {/* Card Header: Icon & Live Badge */}
                  <div className="flex items-center justify-between">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${ag.color} border border-white/10 flex items-center justify-center ${ag.accent} shadow-inner group-hover:scale-105 transition-transform duration-300`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{ag.badge}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-[#FF7900] transition-colors">
                      {ag.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-sans min-h-[40px]">
                      {ag.desc}
                    </p>
                  </div>

                  {/* Tech Stack Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ag.tech.map((tag, tIdx) => (
                      <span 
                        key={tIdx} 
                        className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-white/[0.06]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Interactive Link */}
                <div className="pt-5 mt-5 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
                  <button
                    onClick={() => setActiveTab('console')}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#FF7900] hover:text-orange-600 transition-colors"
                  >
                    <span>{lang === 'ar' ? 'تشغيل وتجربة الوكيل' : 'Test Agent in Console'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <span className="text-[11px] font-mono text-gray-400">
                    node: {ag.id}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
