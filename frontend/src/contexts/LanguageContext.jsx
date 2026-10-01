import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    appTitle: "Orange Smart Support Agent",
    tagline: "End-to-End Autonomous AI Customer Resolution for Orange",
    disclaimer: "Demo project, not affiliated with Orange",
    navHome: "Home",
    navLiveConsole: "Live Console",
    navDashboard: "Dashboard",
    navKB: "Knowledge Base",
    navEvaluation: "Evaluation",
    navHowItWorks: "How It Works",
    lightMode: "Light",
    darkMode: "Dark",
    langToggle: "العربية",
    tryAgent: "Launch Live Console",
    viewArchitecture: "View Architecture",
    heroTitlePrefix: "Next-Gen",
    heroTitleHighlight: "Orange Autonomous Support",
    heroTitleSuffix: "Instant, 100% AI-Driven Customer Resolution Platform",
    heroSubtitle: "The enterprise AI support platform built for Orange Telecom. Delivers end-to-end resolution for billing inquiries, network outages, and mobile plans—audited and executed in real time with zero human delay.",
    featureTitle: "Specialized AI Agent Swarm",
    agentClassifier: "Classifier Agent",
    agentClassifierDesc: "Instant categorization, priority tagging, language detection, and customer sentiment evaluation.",
    agentRetrieval: "Retrieval Agent (RAG)",
    agentRetrievalDesc: "Searches indexed PDF plans & SLA manuals, reads Google Sheets customer accounts, and queries network status APIs.",
    agentRisk: "Sentiment & Risk Agent",
    agentRiskDesc: "Runs concurrently to detect customer churn probability and trigger immediate supervisor escalation.",
    agentResponse: "Response Agent",
    agentResponseDesc: "Drafts hyper-accurate, empathetic replies in the customer's native language using strictly verified facts.",
    agentQA: "QA Audit Agent",
    agentQADesc: "Inspects drafts for truthfulness, tone, and false promises. Automatically loops back for revisions if failed.",
    agentAction: "Action Agent",
    agentActionDesc: "Dispatches customer emails, logs SQLite tickets, updates Google Sheets, and alerts supervisors on critical events.",
    customerInquiry: "Customer Support Message",
    enterMessagePlaceholder: "Type customer message in Arabic or English...",
    sendBtn: "Process Request",
    processing: "Processing Agents...",
    sampleScenarios: "Quick Demo Scenarios:",
    scenarioSlowNet: "Slow Internet (Arabic)",
    scenarioOutage: "Red DSL Light Outage (English)",
    scenarioBilling: "Balance Deducted (Arabic)",
    scenarioFraud: "Overcharged Bill / Fraud (English)",
    scenarioPlan: "Home DSL 140GB Pricing (Arabic)",
    scenarioAnger: "Regulatory Threat / NTRA (Arabic)",
    pipelineStatus: "Multi-Agent Pipeline Progression",
    agentStep: "Step",
    statusIdle: "Idle",
    statusRunning: "Executing...",
    statusCompleted: "Completed",
    statusRetrying: "QA Revision Loop",
    finalReplyTitle: "Generated Response to Customer",
    suggestedActions: "Recommended Steps for Customer",
    citationsTitle: "Verified Knowledge Citations",
    actionsCompleted: "Automated Actions Executed",
    ticketCreated: "Ticket Opened",
    emailDispatched: "Customer Email Sent",
    escalatedBadge: "Escalated to Human Supervisor",
    normalBadge: "Resolved by AI",
    totalTickets: "Total Tickets",
    avgLatency: "Avg Response Time",
    escalationRate: "Escalation Rate",
    qaPassRate: "QA Pass Rate",
    ticketsByCategory: "Tickets by Category",
    sentimentDist: "Sentiment Distribution",
    ticketsOverTime: "Ticket Volume Trend",
    recentTickets: "Recent Customer Tickets",
    generateReportBtn: "Generate Daily Report (PDF/HTML)",
    generatingReport: "Generating...",
    downloadPdf: "Download PDF Report",
    searchTickets: "Search tickets...",
    allCategories: "All Categories",
    allStatuses: "All Statuses",
    reindexBtn: "Re-index Knowledge Base",
    runEvalBtn: "Run 15-Test Evaluation Benchmark",
    evalRunning: "Running Benchmark Suite...",
    evalResultsTitle: "Evaluation Suite Results",
    classAccuracy: "Classification Accuracy",
    escAccuracy: "Escalation Accuracy",
    qaPassRateMetric: "QA Pass Rate",
    avgLatencyMetric: "Average Latency",
    retriesPerTicket: "Avg QA Retries",
    failureRate: "Failure Rate",
    systemStatus: "System Status",
    mockModeBadge: "Demo / Mock Mode Active",
    liveModeBadge: "Gemini API Active"
  },
  ar: {
    appTitle: "وكيل دعم أورنج الذكي",
    tagline: "منصة الرد الآلي الشامل لخدمة عملاء أورنج بالذكاء الاصطناعي",
    disclaimer: "مشروع تعليمي تجريبي، غير تابع رسمياً لشركة أورنج",
    navHome: "الرئيسية",
    navLiveConsole: "المحادثة الحية",
    navDashboard: "لوحة التحكم",
    navKB: "قاعدة المعرفة",
    navEvaluation: "التقييم",
    navHowItWorks: "المعمارية",
    lightMode: "فاتح",
    darkMode: "داكن",
    langToggle: "English",
    tryAgent: "بدء تجربة الوكيل",
    viewArchitecture: "استعراض المعمارية",
    heroTitlePrefix: "منصة",
    heroTitleHighlight: "أورنج للرد الذكي",
    heroTitleSuffix: "حل استفسارات وشكاوى العملاء بالكامل عبر الذكاء الاصطناعي",
    heroSubtitle: "أول منظومة ذكاء اصطناعي متخصصة لقطاع الاتصالات تتولى استقبال استفسارات وشكاوى عملاء أورنج، فحص الحسابات والشبكة، وصياغة الردود الدقيقة وتوثيق الإجراءات فورياً دون أي تدخل بشري.",
    featureTitle: "فريق وكلاء الذكاء الاصطناعي المتخصص",
    agentClassifier: "وكيل التصنيف (Classifier)",
    agentClassifierDesc: "تحديد الفئة، درجة الأولوية، مشاعر العميل، ولغة الرسالة بدقة متناهية.",
    agentRetrieval: "وكيل الاسترجاع (Retrieval RAG)",
    agentRetrievalDesc: "بحث في وثائق الباقات وسياسات الدعم، فحص حساب العميل، واستعلام حالة الشبكة.",
    agentRisk: "وكيل المخاطر والمشاعر (Sentiment & Risk)",
    agentRiskDesc: "يعمل بالتوازي لقياس احتمالية فقدان العميل واتخاذ قرار التصعيد الفوري للمشرف البشري.",
    agentResponse: "وكيل الصياغة (Response Agent)",
    agentResponseDesc: "كتابة ردود دقيقة وموجهة بلغة العميل اعتماداً فقط على الحقائق المعتمدة.",
    agentQA: "وكيل مراقبة الجودة (QA Agent)",
    agentQADesc: "تدقيق الرد لضمان عدم وجود وعود كاذبة ومطابقة سياسة أورنج مع إمكانية الإعادة الآلية.",
    agentAction: "وكيل الأتمتة والإجراءات (Action Agent)",
    agentActionDesc: "إرسال الإيميل، تسجيل التذكرة في النظام وجوجل شيتس، وتنبيه المشرفين عند الخطر.",
    customerInquiry: "رسالة العميل الواردة",
    enterMessagePlaceholder: "اكتب رسالة العميل باللغة العربية أو الإنجليزية...",
    sendBtn: "معالجة الطلب عبر الوكلاء",
    processing: "الوكلاء يعملون الآن...",
    sampleScenarios: "سيناريوهات سريعة للتجربة:",
    scenarioSlowNet: "بطء الإنترنت المنزلي (عربي)",
    scenarioOutage: "انقطاع كامل ولمبة حمراء (إنجليزي)",
    scenarioBilling: "خصم رصيد بدون إشعار (عربي)",
    scenarioFraud: "شكوى فاتورة مرتفعة (إنجليزي)",
    scenarioPlan: "استفسار باقة 140 جيجا (عربي)",
    scenarioAnger: "تهديد بالجهاز القومي للاتصالات (عربي)",
    pipelineStatus: "متابعة تقدم خط سير الوكلاء (Live Pipeline)",
    agentStep: "الخطوة",
    statusIdle: "في الانتظار",
    statusRunning: "جاري التنفيذ...",
    statusCompleted: "اكتمل بنجاح",
    statusRetrying: "إعادة صياغة عبر الـ QA",
    finalReplyTitle: "الرد المعتمد النهائي للعميل",
    suggestedActions: "الخطوات المقترحة للعميل",
    citationsTitle: "المراجع والمصادر المسترجعة (Citations)",
    actionsCompleted: "الإجراءات التلقائية المنفذة",
    ticketCreated: "تم فتح التذكرة",
    emailDispatched: "تم إرسال الإيميل للعميل",
    escalatedBadge: "تم التصعيد للمشرف البشري",
    normalBadge: "تم الحل آلياً بالكامل",
    totalTickets: "إجمالي التذاكر",
    avgLatency: "متوسط وقت الاستجابة",
    escalationRate: "نسبة التصعيد للمشرفين",
    qaPassRate: "نسبة اجتياز تدقيق الجودة",
    ticketsByCategory: "التذاكر حسب الفئة",
    sentimentDist: "توزيع مشاعر العملاء",
    ticketsOverTime: "تطور عدد التذاكر اليومي",
    recentTickets: "سجل أحدث التذاكر",
    generateReportBtn: "توليد التقرير اليومي (PDF/HTML)",
    generatingReport: "جاري التوليد...",
    downloadPdf: "تحميل تقرير PDF",
    searchTickets: "ابحث في التذاكر...",
    allCategories: "جميع الفئات",
    allStatuses: "جميع الحالات",
    reindexBtn: "إعادة فهرسة قاعدة المعرفة",
    runEvalBtn: "تشغيل معيار التقييم (15 اختبار)",
    evalRunning: "جاري تنفيذ مجموعة الاختبارات...",
    evalResultsTitle: "نتائج تقييم النظام ودقة الوكلاء",
    classAccuracy: "دقة التصنيف",
    escAccuracy: "دقة التصعيد",
    qaPassRateMetric: "اجتياز اختبار الجودة",
    avgLatencyMetric: "متوسط وقت المعالجة",
    retriesPerTicket: "متوسط محاولات الإعادة",
    failureRate: "نسبة الأخطاء",
    systemStatus: "حالة النظام",
    mockModeBadge: "وضع العرض التوضيحي (High-Fidelity Demo)",
    liveModeBadge: "متصل بـ Gemini API"
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('ar');
  const [theme, setTheme] = useState('dark');

  const toggleLanguage = () => {
    setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const t = translations[lang];

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [lang, theme]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, theme, toggleTheme, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
