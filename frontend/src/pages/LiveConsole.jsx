import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import PipelineVisualizer from '../components/PipelineVisualizer';
import { streamSupportChat } from '../services/api';
import { 
  Send, 
  Sparkles, 
  User, 
  MapPin, 
  RotateCcw, 
  AlertCircle,
  Zap,
  CheckCircle2,
  MessageSquare,
  Activity,
  Sliders,
  ChevronDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  Mail,
  Ticket,
  Clock,
  PhoneCall,
  UserPlus,
  Trash2,
  RefreshCw,
  LogOut,
  Smartphone,
  Wifi,
  CreditCard,
  Package
} from 'lucide-react';

export default function LiveConsole() {
  const { t, lang } = useLanguage();

  // Saved customer profiles in localStorage
  const [savedProfiles, setSavedProfiles] = useState(() => {
    try {
      const stored = localStorage.getItem('orange_user_profiles');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Active customer profile
  const [activeProfile, setActiveProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('orange_current_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Registration Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('012');
  const [formRegion, setFormRegion] = useState('Cairo');
  const [formPlan, setFormPlan] = useState('Home DSL 140GB (30 Mbps)');
  const [customPlanText, setCustomPlanText] = useState('');
  const [selectedExistingId, setSelectedExistingId] = useState('');

  // Chat State
  const generateNewTicketId = () => {
    return `ORG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };
  const [sessionTicketId, setSessionTicketId] = useState(generateNewTicketId);
  const [viewMode, setViewMode] = useState('chat'); // 'chat' | 'inspector'
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pipelineState, setPipelineState] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showInspectorInline, setShowInspectorInline] = useState(false);

  // Quick Telecom Scenarios
  const scenarios = [
    {
      label: lang === 'ar' ? "استلاف رصيد وسلفني" : "Borrow Credit (Salefny)",
      text: lang === 'ar' ? "عايز استلف رصيد أو اشترك في خدمة سلفني شكراً وكلمني شكراً" : "How do I borrow emergency credit with Salefny?"
    },
    {
      label: lang === 'ar' ? "شحن رصيد بالكارت" : "Recharge Scratch Card",
      text: lang === 'ar' ? "لو عايز اشحن رصيد كارت أورنج ايه الكود والطريقة؟" : "What is the code to recharge using an Orange scratch card?"
    },
    {
      label: lang === 'ar' ? "الخط واقف ومش شغال" : "Line Blocked / Suspended",
      text: lang === 'ar' ? "الخط بتاعي واقف ومفصول ومش بيعمل مكالمات، أعمل إيه علشان يرجع يشتغل؟" : "My line is suspended, how can I unblock and reactivate it?"
    },
    {
      label: lang === 'ar' ? "استبدال شريحة وeSIM" : "SIM Swap & eSIM",
      text: lang === 'ar' ? "عايز اعمل استبدال شريحة بدل فاقد أو احول لشريحة إلكترونية eSIM" : "How do I replace a lost SIM or switch to an eSIM?"
    },
    {
      label: lang === 'ar' ? "أورنج كاش وتحويل فلوس" : "Orange Cash & Transfer",
      text: lang === 'ar' ? "ازاي افتح محفظة أورنج كاش واحول فلوس لأي رقم موبايل؟" : "How to open an Orange Cash wallet and transfer money?"
    },
    {
      label: lang === 'ar' ? "حالة وتغطية الشبكة" : "Network Coverage",
      text: lang === 'ar' ? "إيه أخبار الشبكة والتغطية في منطقتي وليه الإرسال ضعيف؟" : "What is the network signal status in my area?"
    },
    {
      label: lang === 'ar' ? "لمبة الراوتر حمراء" : "Router Red Light",
      text: lang === 'ar' ? "الإنترنت قاطع تماماً والراوتر منور لمبة حمراء في لمبة الـ DSL من الصبح" : "My internet is completely down with a red DSL light on the router."
    },
    {
      label: lang === 'ar' ? "أسعار باقات Home DSL" : "Home DSL Pricing",
      text: lang === 'ar' ? "عايز اعرف اسعار باقات النت المنزلي Home DSL وسرعاتها" : "What are the Home DSL packages, speeds, and monthly pricing?"
    }
  ];

  // Save profile & start chat
  const handleRegisterProfile = (e) => {
    if (e) e.preventDefault();
    if (!formName.trim()) return;

    const chosenPlan = formPlan === 'custom' ? (customPlanText.trim() || 'باقة مخصصة') : formPlan;
    const profileId = selectedExistingId || ('CUST-' + Math.floor(1000 + Math.random() * 9000));
    
    const newProfile = {
      id: profileId,
      name: formName.trim(),
      phone: formPhone.trim() || '01200000000',
      region: formRegion,
      plan: chosenPlan,
      createdAt: new Date().toISOString()
    };

    // Update saved profiles in localStorage
    const updatedProfiles = [
      newProfile,
      ...savedProfiles.filter(p => p.id !== profileId && p.name !== newProfile.name)
    ];

    setSavedProfiles(updatedProfiles);
    setActiveProfile(newProfile);
    setChatHistory([]);
    setPipelineState(null);
    setSessionTicketId(generateNewTicketId());

    try {
      localStorage.setItem('orange_user_profiles', JSON.stringify(updatedProfiles));
      localStorage.setItem('orange_current_profile', JSON.stringify(newProfile));
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
  };

  // Select an existing saved profile
  const handleSelectSavedProfile = (profileId) => {
    if (!profileId) {
      setSelectedExistingId('');
      setFormName('');
      setFormPhone('012');
      return;
    }
    const found = savedProfiles.find(p => p.id === profileId);
    if (found) {
      setSelectedExistingId(found.id);
      setFormName(found.name);
      setFormPhone(found.phone);
      setFormRegion(found.region);
      setFormPlan(found.plan);
    }
  };

  // Delete a saved profile
  const handleDeleteProfile = (profileId, e) => {
    e.stopPropagation();
    const updated = savedProfiles.filter(p => p.id !== profileId);
    setSavedProfiles(updated);
    if (activeProfile?.id === profileId) {
      setActiveProfile(null);
      localStorage.removeItem('orange_current_profile');
    }
    try {
      localStorage.setItem('orange_user_profiles', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Switch / Logout current profile to register another
  const handleSwitchProfile = () => {
    setActiveProfile(null);
    localStorage.removeItem('orange_current_profile');
    setChatHistory([]);
    setPipelineState(null);
    setFormName('');
    setSelectedExistingId('');
    setSessionTicketId(generateNewTicketId());
  };

  // Reset chat session
  const handleResetChat = () => {
    setMessage('');
    setChatHistory([]);
    setPipelineState(null);
    setErrorMessage(null);
    setShowInspectorInline(false);
    setSessionTicketId(generateNewTicketId());
  };

  // Submit or trigger chat message
  const sendChatMessage = (textOverride) => {
    const rawMsg = typeof textOverride === 'string' ? textOverride : message;
    if (!rawMsg || !rawMsg.trim() || isStreaming || !activeProfile) return;

    const userMsg = rawMsg.trim();
    setMessage('');
    setIsStreaming(true);
    setErrorMessage(null);

    const timeString = new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });

    // Append user message
    setChatHistory(prev => [
      ...prev,
      {
        sender: 'user',
        text: userMsg,
        timestamp: timeString
      }
    ]);

    const initState = {
      ticket_id: sessionTicketId,
      message: userMsg,
      customer_id: activeProfile.id,
      region: activeProfile.region,
      timeline: [],
      total_duration_ms: 0,
      classification: null,
      retrieval: null,
      sentiment_risk: null,
      response: null,
      qa: null,
      actions: null
    };
    setPipelineState(initState);

    const chatPayload = {
      message: userMsg,
      ticket_id: sessionTicketId,
      customer_id: activeProfile.id,
      customer_name: activeProfile.name,
      customer_email: `${activeProfile.name.replace(/\s+/g, '.').toLowerCase()}@orange-user.com`,
      customer_phone: activeProfile.phone,
      customer_plan: activeProfile.plan,
      region: activeProfile.region,
      conversation_history: chatHistory.map(item => ({
        sender: item.sender,
        text: item.text,
        timestamp: item.timestamp
      }))
    };

    streamSupportChat(
      chatPayload,
      (eventData) => {
        if (eventData.event === 'step_start') {
          if (eventData.ticket_id) {
            initState.ticket_id = eventData.ticket_id;
          }
          setPipelineState((prev) => ({
            ...prev,
            ticket_id: eventData.ticket_id || prev?.ticket_id
          }));
        } else if (eventData.event === 'step_complete') {
          const stepData = eventData.data;
          setPipelineState((prev) => {
            const nextTimeline = [...(prev?.timeline || []), stepData];
            const updated = { ...prev, timeline: nextTimeline };
            if (eventData.step === 'classifier') updated.classification = stepData.data;
            if (eventData.step === 'retrieval') updated.retrieval = stepData.data;
            if (eventData.step === 'sentiment_risk') updated.sentiment_risk = stepData.data;
            if (eventData.step === 'response') updated.response = stepData.data;
            if (eventData.step === 'qa') updated.qa = stepData.data;
            if (eventData.step === 'action') updated.actions = stepData.data;
            return updated;
          });
        } else if (eventData.event === 'pipeline_complete') {
          setPipelineState(eventData.final_state);
          if (eventData.final_state?.response?.reply_text) {
            setChatHistory(prev => [
              ...prev,
              {
                sender: 'assistant',
                text: eventData.final_state.response.reply_text,
                suggested_actions: eventData.final_state.response.suggested_actions || [],
                ticket_id: eventData.final_state.ticket_id,
                actions: eventData.final_state.actions || {},
                timestamp: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }
        } else if (eventData.event === 'error') {
          setErrorMessage(eventData.error);
        }
      },
      async (err) => {
        console.warn('SSE stream interrupted or failed, attempting direct sync fallback:', err);
        try {
          const fallbackRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chatPayload)
          });
          const data = await fallbackRes.json();
          const finalState = data.final_state || data;
          if (finalState?.response?.reply_text) {
            setPipelineState(finalState);
            setChatHistory(prev => [
              ...prev,
              {
                sender: 'assistant',
                text: finalState.response.reply_text,
                suggested_actions: finalState.response.suggested_actions || [],
                ticket_id: finalState.ticket_id || data.ticket_id,
                actions: finalState.actions || {},
                timestamp: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
              }
            ]);
            setErrorMessage(null);
          } else {
            setErrorMessage(lang === 'ar' ? 'تعذر استلام رد الوكلاء' : 'Failed to receive response');
          }
        } catch (fallbackErr) {
          setErrorMessage(err.message || (lang === 'ar' ? 'حدث خطأ في الاتصال بالوكلاء' : 'Stream connection error'));
        } finally {
          setIsStreaming(false);
        }
      },
      () => {
        setIsStreaming(false);
      }
    );
  };

  const handleSubmitMessage = (e) => {
    if (e) e.preventDefault();
    sendChatMessage();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              {lang === 'ar' ? 'المحادثة الذكية الحية لعملاء أورنج' : 'Orange Live AI Support Chat'}
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{lang === 'ar' ? 'نظام الوكلاء متصل' : 'Agents Live'}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === 'ar' 
              ? 'محادثة تفاعلية فورية تحاكي خدمة عملاء أورنج للرد على الشكاوى والباقات وأعطال الشبكة ذاتياً.'
              : 'Interactive customer support simulator powered by Orange autonomous multi-agent AI.'}
          </p>
        </div>

        {/* View Switcher */}
        {activeProfile && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center bg-gray-100 dark:bg-[#16161F] p-1 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold">
              <button
                onClick={() => setViewMode('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'chat'
                    ? 'bg-[#FF7900] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'محادثة العميل' : 'Customer Chat'}</span>
              </button>
              <button
                onClick={() => setViewMode('inspector')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'inspector'
                    ? 'bg-[#FF7900] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'مسار الوكلاء (DAG)' : 'Agent Pipeline'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STEP 1: ONBOARDING / CUSTOMER REGISTRATION CARD (IF NOT REGISTERED YET) */}
      {!activeProfile && (
        <div className="max-w-2xl mx-auto py-2 sm:py-4">
          <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[#16161F]/95 backdrop-blur-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            
            {/* Header: Compact & Elegant */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-start pb-3 border-b border-gray-100 dark:border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-amber-500/10 border border-[#FF7900]/30 flex items-center justify-center p-2 shadow-inner shrink-0">
                <img 
                  src="/orange-vector.svg" 
                  alt="Orange" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                  <span>{lang === 'ar' ? 'سجل بياناتك لبدء المحادثة الذكية' : 'Register Profile to Start Support'}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-[#FF7900] border border-orange-500/20">
                    {lang === 'ar' ? 'خطوة واحدة' : '1 Step'}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {lang === 'ar' 
                    ? 'اكتب اسمك واشتراكك بيدك لحفظها محلياً وربطها بنظام فحص الأعطال والشبكة فورياً.'
                    : 'Enter your profile to verify your line, open tickets, and run network diagnostics.'}
                </p>
              </div>
            </div>

            {/* Quick Selector if saved profiles exist in localStorage */}
            {savedProfiles.length > 0 && (
              <div className="p-3 rounded-2xl bg-orange-500/5 border border-orange-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#FF7900] flex items-center gap-1.5 shrink-0">
                  <User className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'حساباتك المسجلة:' : 'Saved Profiles:'}</span>
                </span>
                
                <div className="flex flex-wrap items-center gap-1.5">
                  {savedProfiles.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => handleSelectSavedProfile(p.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        selectedExistingId === p.id
                          ? 'border-[#FF7900] bg-orange-500/20 text-[#FF7900] font-bold shadow-sm'
                          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 text-gray-700 dark:text-gray-300 hover:border-orange-500/40'
                      }`}
                    >
                      <span className="truncate max-w-[120px]">{p.name}</span>
                      <button 
                        type="button"
                        onClick={(e) => handleDeleteProfile(p.id, e)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                        title={lang === 'ar' ? 'حذف هذا الحساب' : 'Delete profile'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Registration Form in 2-Column Grid */}
            <form onSubmit={handleRegisterProfile} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* 1. Name */}
                <div className="space-y-1">
                  <label className="text-gray-700 dark:text-gray-200 font-bold flex items-center gap-1.5 text-xs">
                    <User className="w-3.5 h-3.5 text-[#FF7900]" />
                    <span>{lang === 'ar' ? 'الاسم بالكامل:' : 'Full Name:'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={lang === 'ar' ? "مثال: أحمد مصطفى" : "e.g. Ahmed Mostafa"}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/90 px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#FF7900] outline-none shadow-inner"
                  />
                </div>

                {/* 2. Phone */}
                <div className="space-y-1">
                  <label className="text-gray-700 dark:text-gray-200 font-bold flex items-center gap-1.5 text-xs">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{lang === 'ar' ? 'رقم الهاتف / الخط الأرضي:' : 'Phone / Line Number:'}</span>
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="012xxxxxxxx"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/90 px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-[#FF7900] outline-none shadow-inner"
                  />
                </div>

                {/* 3. Region */}
                <div className="space-y-1">
                  <label className="text-gray-700 dark:text-gray-200 font-bold flex items-center gap-1.5 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span>{lang === 'ar' ? 'المحافظة / نطاق الشبكة:' : 'Region / Network:'}</span>
                  </label>
                  <select
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/90 px-3 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#FF7900] outline-none shadow-inner"
                  >
                    <option value="Cairo">{lang === 'ar' ? 'القاهرة (صيانة جزئية في التجمع)' : 'Cairo (Maintenance)'}</option>
                    <option value="Giza">{lang === 'ar' ? 'الجيزة (الشبكة مستقرة 100%)' : 'Giza (Operational)'}</option>
                    <option value="Alexandria">{lang === 'ar' ? 'الإسكندرية (الشبكة مستقرة 100%)' : 'Alexandria (Operational)'}</option>
                    <option value="Mansoura">{lang === 'ar' ? 'المنصورة (عطل قطع فايبر مؤقت)' : 'Mansoura (Fiber Cut Outage)'}</option>
                    <option value="Assiut">{lang === 'ar' ? 'أسيوط / الصعيد (الشبكة مستقرة)' : 'Assiut (Operational)'}</option>
                    <option value="Tanta">{lang === 'ar' ? 'طنطا / الدلتا (الشبكة مستقرة)' : 'Tanta (Operational)'}</option>
                  </select>
                </div>

                {/* 4. Plan */}
                <div className="space-y-1">
                  <label className="text-gray-700 dark:text-gray-200 font-bold flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <span>{lang === 'ar' ? 'نوع الباقة الحالية:' : 'Current Plan:'}</span>
                  </label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/90 px-3 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#FF7900] outline-none shadow-inner"
                  >
                    <option value="Home DSL 140GB (30 Mbps)">{lang === 'ar' ? 'Home DSL 140GB (30 ميجا)' : 'Home DSL 140GB (30 Mbps)'}</option>
                    <option value="Home DSL 250GB (70 Mbps)">{lang === 'ar' ? 'Home DSL 250GB (70 ميجا)' : 'Home DSL 250GB (70 Mbps)'}</option>
                    <option value="Home DSL 400GB (100 Mbps)">{lang === 'ar' ? 'Home DSL 400GB (100 ميجا)' : 'Home DSL 400GB (100 Mbps)'}</option>
                    <option value="4G Mobile Data Unlimited">{lang === 'ar' ? 'إنترنت موبايل 4G غير محدود' : '4G Mobile Data Unlimited'}</option>
                    <option value="غير مشترك / عميل جديد">{lang === 'ar' ? 'غير مشترك / عميل جديد' : 'New Customer / No Plan'}</option>
                    <option value="custom">{lang === 'ar' ? '✏️ كتابة باقة مخصصة...' : '✏️ Custom plan...'}</option>
                  </select>
                </div>

                {/* Custom Plan Input if selected */}
                {formPlan === 'custom' && (
                  <div className="sm:col-span-2 space-y-1">
                    <input
                      type="text"
                      value={customPlanText}
                      onChange={(e) => setCustomPlanText(e.target.value)}
                      placeholder={lang === 'ar' ? "اكتب اسم وتفاصيل باقتك..." : "Enter custom plan details..."}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/90 px-3.5 py-2 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#FF7900]"
                    />
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#FF7900] to-orange-600 hover:from-orange-500 hover:to-[#FF7900] text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                <span>{lang === 'ar' ? 'تسجيل الدخول وبدء المحادثة' : 'Save & Launch Chat'}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </form>

          </div>
        </div>
      )}

      {/* STEP 2: ACTIVE CUSTOMER CHAT INTERFACE (ONLY SHOWN AFTER REGISTRATION) */}
      {activeProfile && viewMode === 'chat' && (
        <div className="space-y-4">

          {/* Main Chat Box Container */}
          <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[#15151D]/95 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col h-[650px]">
            
            {/* Unified Top HUD & Branding Header */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-gray-200 dark:border-white/10 bg-gray-50/90 dark:bg-[#181822] flex flex-wrap items-center justify-between gap-3 shrink-0">
              
              {/* Agent Identity */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src="/orange-vector.svg" 
                    alt="Orange" 
                    className="w-9 h-9 object-contain rounded-xl shadow-md p-1 bg-black/40 border border-orange-500/30"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#181822] animate-pulse"></span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span>{lang === 'ar' ? 'خدمة عملاء أورنج الذكية' : 'Orange Smart Support AI'}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FF7900]" />
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <span className="text-emerald-500 font-bold">{lang === 'ar' ? 'متصل الآن' : 'Live'}</span>
                    <span>•</span>
                    <span>{lang === 'ar' ? 'استجابة فورية وتدقيق جودة 100%' : 'Autonomous Resolution • 100% QA'}</span>
                  </p>
                </div>
              </div>

              {/* Customer Verified Line Capsule */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-2xl bg-black/20 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 text-xs font-medium">
                <span className="text-[#FF7900] font-bold flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{activeProfile.name}</span>
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-400" />
                  <span>{activeProfile.region}</span>
                </span>
                <span className="text-gray-400">•</span>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-[#FF7900] text-[10px] font-bold border border-orange-500/20 truncate max-w-[140px]">
                  {activeProfile.plan}
                </span>
              </div>

              {/* Switch Customer & New Chat Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSwitchProfile}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E1E24] hover:border-orange-500 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all shadow-sm"
                  title={lang === 'ar' ? 'تبديل الحساب أو تسجيل عميل آخر' : 'Switch or add customer'}
                >
                  <LogOut className="w-3.5 h-3.5 text-[#FF7900]" />
                  <span className="hidden sm:inline">{lang === 'ar' ? 'تبديل الحساب' : 'Switch'}</span>
                </button>

                <button
                  onClick={handleResetChat}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E1E24] hover:border-orange-500 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all shadow-sm"
                  title={lang === 'ar' ? 'بدء محادثة جديدة' : 'New chat'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{lang === 'ar' ? 'محادثة جديدة' : 'New'}</span>
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              
              {/* INTERACTIVE WELCOME HERO & QUICK SERVICES (Fills the initial void cleanly) */}
              {chatHistory.length === 0 && (
                <div className="space-y-4 py-2">
                  
                  {/* Greeting Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FF7900] flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                          {lang === 'ar' 
                            ? `أهلاً بك يا ${activeProfile.name} في الدعم الذكي لـ أورنج مصر` 
                            : `Welcome ${activeProfile.name} to Orange Smart Support`}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                          {lang === 'ar'
                            ? `تم ربط محادثتك بنجاح ببيانات باقتك (${activeProfile.plan}) ومتابعة حالة الشبكة في (${activeProfile.region}). اختر من الخدمات السريعة أدناه أو اكتب استفسارك مباشرة.`
                            : `Connected to your plan (${activeProfile.plan}) and network node in (${activeProfile.region}). Choose a quick action below or type your inquiry.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section Title */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#FF7900]" />
                      <span>{lang === 'ar' ? 'الخدمات والاستفسارات السريعة المتاحة لخطك:' : 'Quick Services Available for Your Line:'}</span>
                    </span>
                    <span className="text-[11px] text-[#FF7900] font-medium">
                      {lang === 'ar' ? 'اضغط للبدء فوراً' : 'Tap to launch'}
                    </span>
                  </div>

                  {/* 6 Quick Action Service Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {[
                      {
                        icon: Wifi,
                        title: lang === 'ar' ? 'فحص سرعة واستقرار الخط' : 'Line Speed & Stability Test',
                        desc: lang === 'ar' ? 'فحص آلي للإشارة وعمل إعادة تهيئة للمنفذ (Port Reset)' : 'Automated signal test and digital port reset',
                        prompt: lang === 'ar' ? 'عندي بطء في سرعة النت المنزلي وعايز فحص للخط' : 'I am experiencing slow internet, please run a line check',
                        badge: lang === 'ar' ? 'فحص آلي' : 'Diagnostic',
                        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                      },
                      {
                        icon: AlertCircle,
                        title: lang === 'ar' ? 'لمبة الراوتر حمراء (انقطاع النت)' : 'Router Red Light Troubleshooting',
                        desc: lang === 'ar' ? 'خطوات فورية لإعادة مزامنة إشارة DSL وحل العطل' : 'Resolve DSL sync failure & red light outage',
                        prompt: lang === 'ar' ? 'لمبة الراوتر حمرا ومش عارف اعمل ايه والنت قاطع' : 'The router DSL light is red and internet is disconnected',
                        badge: lang === 'ar' ? 'عطل فني' : 'Technical',
                        color: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                      },
                      {
                        icon: Package,
                        title: lang === 'ar' ? 'باقات Home DSL والترقية' : 'Home DSL Plans & Upgrades',
                        desc: lang === 'ar' ? 'أسعار وسعات باقات 140GB و250GB و400GB و600GB' : 'Official Home DSL pricing and quota details',
                        prompt: lang === 'ar' ? 'عايز اعرف اسعار باقات النت المنزلي Home DSL' : 'What are the current Home DSL package prices?',
                        badge: lang === 'ar' ? 'باقات أورنج' : 'Orange Plans',
                        color: 'text-orange-500 bg-orange-500/10 border-orange-500/20'
                      },
                      {
                        icon: ShieldCheck,
                        title: lang === 'ar' ? 'الاستعلام عن الرصيد' : 'Balance Inquiries',
                        desc: lang === 'ar' ? 'معرفة ومتابعة الرصيد عبر تطبيق My Orange أو #100#' : 'Check balance via My Orange or #100#',
                        prompt: lang === 'ar' ? 'عايز اعرف رصيدي كام؟' : 'How can I check my current balance?',
                        badge: lang === 'ar' ? 'أمان الحساب' : 'Security',
                        color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
                      },
                      {
                        icon: CreditCard,
                        title: lang === 'ar' ? 'شحن ودفع الفواتير' : 'Recharge & Billing',
                        desc: lang === 'ar' ? 'الدفع بأورنج كاش (#115#) أو كروت الشحن (#102*)' : 'Pay via Orange Cash (#115#) or recharge cards',
                        prompt: lang === 'ar' ? 'كيف أقوم بشحن الرصيد ودفع الفاتورة؟' : 'How do I recharge my account or pay bills?',
                        badge: lang === 'ar' ? 'دفع وشحن' : 'Billing',
                        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                      },
                      {
                        icon: Smartphone,
                        title: lang === 'ar' ? 'باقات الموبايل إنترنت GO' : 'GO Mobile Data Add-Ons',
                        desc: lang === 'ar' ? 'أكواد باقات 4G الإضافية والتجديد المبكر' : 'Mobile 4G data bundles and USSD codes',
                        prompt: lang === 'ar' ? 'ما هي باقات الموبايل إنترنت GO وأكوادها؟' : 'What are the GO mobile internet bundles?',
                        badge: lang === 'ar' ? 'إنترنت 4G' : '4G Internet',
                        color: 'text-purple-500 bg-purple-500/10 border-purple-500/20'
                      }
                    ].map((svc, i) => {
                      const IconComponent = svc.icon;
                      return (
                        <div
                          key={i}
                          onClick={() => sendChatMessage(svc.prompt)}
                          className="group p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#1A1A24]/70 hover:border-[#FF7900] hover:bg-orange-500/5 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${svc.color} shrink-0`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:text-[#FF7900] group-hover:bg-orange-500/10 transition-colors">
                              {svc.badge}
                            </span>
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#FF7900] transition-colors">
                              {svc.title}
                            </h5>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                              {svc.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* Chat History Messages */}
              {chatHistory.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-3 ${item.sender === 'user' ? 'justify-end' : 'justify-start max-w-2xl'}`}
                >
                  {item.sender === 'assistant' && (
                    <img 
                      src="/orange-vector.svg" 
                      alt="Orange" 
                      className="w-8 h-8 object-contain rounded-xl shrink-0 mt-1 shadow-sm p-0.5 bg-black/40 border border-orange-500/30"
                    />
                  )}

                  <div className={`space-y-2 max-w-[85%] sm:max-w-xl ${
                    item.sender === 'user'
                      ? 'bg-gradient-to-r from-[#FF7900] to-orange-600 text-white p-4 rounded-2xl rounded-tl-none rtl:rounded-tl-2xl rtl:rounded-tr-none shadow-md shadow-orange-500/20'
                      : 'bg-gray-100/90 dark:bg-[#1D1D27]/90 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 p-4 sm:p-5 rounded-2xl rounded-tr-none rtl:rounded-tr-2xl rtl:rounded-tl-none shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between text-[11px] opacity-75 font-mono mb-1">
                      <span className="font-bold">{item.sender === 'user' ? activeProfile.name : 'خدمة عملاء أورنج'}</span>
                      <span>{item.timestamp}</span>
                    </div>

                    <p className="text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-wrap">
                      {item.text}
                    </p>

                    {item.suggested_actions && item.suggested_actions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 space-y-1.5">
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 block">
                          {lang === 'ar' ? '📋 الخطوات المقترحة للحل:' : '📋 Recommended Actions:'}
                        </span>
                        <ul className="text-xs space-y-1 list-disc list-inside text-gray-600 dark:text-gray-300">
                          {item.suggested_actions.map((act, i) => (
                            <li key={i}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.ticket_id && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                          <Ticket className="w-3 h-3" />
                          <span>{lang === 'ar' ? `تذكرة: ${item.ticket_id}` : `Ticket: ${item.ticket_id}`}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
                          <Mail className="w-3 h-3" />
                          <span>{lang === 'ar' ? 'تم إرسال بريد رسمي' : 'Email Sent'}</span>
                        </span>

                        {item.actions?.escalated && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-bold border border-red-500/20">
                            <PhoneCall className="w-3 h-3" />
                            <span>{lang === 'ar' ? 'تم تحويل الشكوى للمشرف' : 'Escalated to Supervisor'}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming Indicator */}
              {isStreaming && (
                <div className="flex items-start gap-3 max-w-2xl">
                  <img 
                    src="/orange-vector.svg" 
                    alt="Orange" 
                    className="w-8 h-8 object-contain rounded-xl shrink-0 mt-1 shadow-sm p-0.5 bg-black/40 border border-orange-500/30 animate-pulse"
                  />
                  <div className="p-4 rounded-2xl bg-gray-100 dark:bg-[#1D1D27] border border-orange-500/30 text-xs sm:text-sm text-gray-800 dark:text-gray-200 space-y-2">
                    <div className="flex items-center gap-2 text-[#FF7900] font-bold">
                      <span className="w-2 h-2 rounded-full bg-[#FF7900] animate-ping"></span>
                      <span>{lang === 'ar' ? 'وكلاء أورنج يعملون على فحص طلبك...' : 'Orange Agents processing request...'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-mono text-gray-500 dark:text-gray-400">
                      <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-500">1. Classifier</span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">2. RAG Retrieval</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">3. QA Validation</span>
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-500">4. Action Engine</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Chat Input Dock: Floating & Sleek */}
            <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#181822]/90 space-y-2.5">
              
              {/* Quick Scenarios Carousel */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 shrink-0 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#FF7900]" />
                  <span>{lang === 'ar' ? 'سيناريوهات سريعة:' : 'Quick:'}</span>
                </span>
                {scenarios.map((sc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendChatMessage(sc.text)}
                    className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1F1F2C] hover:border-[#FF7900] hover:text-[#FF7900] transition-all shadow-sm shrink-0"
                  >
                    {sc.label}
                  </button>
                ))}
              </div>

              {/* Text Input & Submit Dock */}
              <form onSubmit={handleSubmitMessage} className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-white/10 shadow-sm focus-within:border-[#FF7900] focus-within:ring-2 focus-within:ring-[#FF7900]/20 transition-all">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={lang === 'ar' ? `اكتب رسالتك يا ${activeProfile.name}...` : `Type your message, ${activeProfile.name}...`}
                  disabled={isStreaming}
                  className="flex-1 px-3 py-2 bg-transparent text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none"
                />

                <button
                  type="submit"
                  disabled={isStreaming || !message.trim()}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-1.5 shadow-md transition-all shrink-0 ${
                    isStreaming || !message.trim()
                      ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-[#FF7900] to-orange-600 hover:from-orange-500 hover:to-[#FF7900] shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                  <span>{isStreaming ? (lang === 'ar' ? 'جاري الحل...' : 'Solving...') : (lang === 'ar' ? 'إرسال' : 'Send')}</span>
                </button>
              </form>

              <div className="flex items-center justify-between text-[10px] text-gray-400 px-1">
                <span>{lang === 'ar' ? 'نظام دعم أورنج الذكي • تدقيق آلي فوري 100%' : 'Orange Smart Agent System • Instant QA'}</span>
                <span>{lang === 'ar' ? 'اضغط Enter للإرسال السريع' : 'Press Enter to send'}</span>
              </div>
            </div>

          </div>



        </div>
      )}

      {/* STEP 3: AGENT SWARM INSPECTOR VIEW (FOR COURSE EXAMINERS) */}
      {activeProfile && viewMode === 'inspector' && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24] p-5 shadow-sm">
          <PipelineVisualizer 
            pipelineState={pipelineState} 
            isStreaming={isStreaming} 
          />
        </div>
      )}

    </div>
  );
}
