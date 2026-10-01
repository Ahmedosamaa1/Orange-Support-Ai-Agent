import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchKpis, fetchTickets, updateTicketReview, generateDailyReport } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
import { 
  Ticket, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileDown, 
  Search, 
  Filter, 
  X, 
  FileText,
  User,
  Phone,
  MapPin,
  Wifi,
  Inbox,
  CheckCheck,
  PhoneCall,
  Eye,
  MessageSquare,
  Sparkles,
  Save,
  Smile,
  Frown,
  Meh,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const { t } = useLanguage();

  const [kpis, setKpis] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all', 'unopened', 'needs_followup', 'reviewed_and_handled'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reviewerNotesInput, setReviewerNotesInput] = useState('');
  const [updatingReview, setUpdatingReview] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportDownloadUrl, setReportDownloadUrl] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kpiRes, ticketRes] = await Promise.all([
        fetchKpis(),
        fetchTickets(search, categoryFilter, statusFilter, reviewFilter)
      ]);
      setKpis(kpiRes);
      setTickets(ticketRes.tickets || []);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, statusFilter, reviewFilter]);

  useEffect(() => {
    if (selectedTicket) {
      setReviewerNotesInput(selectedTicket.reviewer_notes || '');
    }
  }, [selectedTicket]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleUpdateReviewStatus = async (ticketId, newStatus, customNotes = null) => {
    try {
      setUpdatingReview(true);
      const notesToSend = customNotes !== null ? customNotes : reviewerNotesInput;
      const res = await updateTicketReview(ticketId, newStatus, notesToSend);
      if (res && res.ticket) {
        setSelectedTicket(res.ticket);
        setTickets(prev => prev.map(item => item.id === ticketId ? res.ticket : item));
        
        // Refresh KPI counts
        fetchKpis().then(resKpi => setKpis(resKpi));

        // Toast feedback
        const statusArabic = 
          newStatus === 'reviewed_and_handled' ? 'تم تعيين الحالة: تم المراجعة والتعامل مع العميل ✅' :
          newStatus === 'needs_followup' ? 'تم تعيين الحالة: متابعة مع العميل 📞' :
          'تمت إعادة التذكرة إلى: لم يتم فتح المحادثة ⏳';
        setToastMessage(statusArabic);
        setTimeout(() => setToastMessage(''), 3500);
      }
    } catch (err) {
      console.error('Error updating review status:', err);
    } finally {
      setUpdatingReview(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedTicket) return;
    await handleUpdateReviewStatus(selectedTicket.id, selectedTicket.review_status || 'unopened', reviewerNotesInput);
    setToastMessage('تم حفظ ملاحظات المشرف بنجاح! 💾');
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const res = await generateDailyReport();
      setReportDownloadUrl(res.pdf_download_url);
    } catch (e) {
      console.error('Report generation error:', e);
    } finally {
      setGeneratingReport(false);
    }
  };

  const COLORS = ['#FF7900', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
  const SENTIMENT_COLORS = {
    happy: '#10B981',
    neutral: '#6B7280',
    frustrated: '#F59E0B',
    angry: '#EF4444'
  };

  // Emotion and Satisfaction Badge Helper
  const getEmotionBadge = (emotion, sentiment) => {
    const emo = (emotion || sentiment || 'neutral').toLowerCase();
    if (emo === 'satisfied' || emo === 'happy' || emo === 'delighted') {
      return {
        label: 'راضي ومبسوط 😊',
        scoreLabel: 'مستوى رضا ممتاز',
        color: 'text-emerald-500',
        bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
      };
    }
    if (emo === 'angry') {
      return {
        label: 'متعصب وغاضب 😡',
        scoreLabel: 'غضب واستياء شديد',
        color: 'text-red-500',
        bg: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800'
      };
    }
    if (emo === 'frustrated') {
      return {
        label: 'محبط ومتضايق 😠',
        scoreLabel: 'إحباط وانزعاج',
        color: 'text-amber-500',
        bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
      };
    }
    if (emo === 'anxious') {
      return {
        label: 'قلقان ومتردد 😟',
        scoreLabel: 'قلق من الخدمة',
        color: 'text-purple-500',
        bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
      };
    }
    return {
      label: 'محايد 😐',
      scoreLabel: 'استفسار اعتيادي',
      color: 'text-gray-500',
      bg: 'bg-gray-50 text-gray-700 dark:bg-gray-900/60 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
    };
  };

  // Review Status Badge Helper
  const getReviewBadge = (status) => {
    if (status === 'reviewed_and_handled') {
      return {
        label: 'تم المراجعة والتعامل',
        icon: CheckCheck,
        bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
      };
    }
    if (status === 'needs_followup') {
      return {
        label: 'متابعة مع العميل',
        icon: PhoneCall,
        bg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
      };
    }
    return {
      label: 'لم يتم فتح المحادثة',
      icon: Inbox,
      bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
    };
  };

  // Parse session transcript safely
  const parseSessionTranscript = (ticket) => {
    if (!ticket) return [];
    if (ticket.session_transcript) {
      try {
        const parsed = typeof ticket.session_transcript === 'string' 
          ? JSON.parse(ticket.session_transcript) 
          : ticket.session_transcript;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.error('Failed to parse session transcript JSON:', err);
      }
    }
    // Fallback to customer message and reply
    const fallback = [];
    if (ticket.message) {
      fallback.push({
        role: 'user',
        content: ticket.message,
        timestamp: ticket.created_at
      });
    }
    if (ticket.reply) {
      fallback.push({
        role: 'assistant',
        content: ticket.reply,
        timestamp: ticket.resolved_at || ticket.created_at
      });
    }
    return fallback;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-900 text-white shadow-2xl border border-gray-700 text-xs font-bold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {t.navDashboard}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            لوحة مراجعة الجلسات وتدقيق أداء ورضا العملاء وإدارة التذاكر الشاملة
          </p>
        </div>

        {/* Generate Report Button */}
        <div className="flex items-center gap-2">
          {reportDownloadUrl && (
            <a
              href={reportDownloadUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{t.downloadPdf}</span>
            </a>
          )}

          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF7900] hover:bg-[#E06000] text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>{generatingReport ? t.generatingReport : t.generateReportBtn}</span>
          </button>
        </div>
      </div>

      {/* KPI 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tickets */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.totalTickets}</span>
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-[#FF7900] flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-2 font-mono">
            {kpis?.total_tickets ?? '--'}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">100% مسجلة وموثقة</span>
        </div>

        {/* Avg Latency */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.avgLatency}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-2 font-mono">
            {kpis?.avg_response_time_ms ? `${kpis.avg_response_time_ms}ms` : '--'}
          </div>
          <span className="text-[11px] text-blue-500 font-medium">معدل استجابة الذكاء الاصطناعي</span>
        </div>

        {/* Escalation Rate */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.escalationRate}</span>
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 mt-2 font-mono">
            {kpis ? `${kpis.escalation_rate}%` : '--'}
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">حالات تستدعي تدخل بشري</span>
        </div>

        {/* QA Pass Rate */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.qaPassRate}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {kpis ? `${kpis.qa_pass_rate}%` : '--'}
          </div>
          <span className="text-[11px] text-emerald-500 font-medium">مطابقة لمعايير أورنج الدقيقة</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Category Volume (BarChart) */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24] shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            {t.ticketsByCategory}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis?.by_category || []}>
                <XAxis dataKey="category" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E1E24', borderColor: '#333', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#FF7900" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Customer Mood & Satisfaction Distribution (PieChart) */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24] shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            مؤشر رضا ومشاعر العملاء
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kpis?.by_sentiment || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="sentiment"
                >
                  {(kpis?.by_sentiment || []).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={SENTIMENT_COLORS[entry.sentiment] || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E1E24', borderColor: '#333', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Tickets Audit & Review Section */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E24] shadow-sm overflow-hidden space-y-0">
        
        {/* Review Status Top Filter Tabs (The requested Sections) */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#18181D]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider block mb-1">
                نظام تدقيق الجلسات وفلترة الحالات
              </span>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <span>سجل المراجعة والتحكم في التذاكر</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-mono">
                  {tickets.length} تذكرة
                </span>
              </h3>
            </div>

            {/* The 4 Main Review Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Tab: All */}
              <button
                onClick={() => setReviewFilter('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  reviewFilter === 'all'
                    ? 'bg-[#FF7900] text-white shadow-md shadow-orange-500/20'
                    : 'bg-white dark:bg-[#1E1E24] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
                }`}
              >
                <span>جميع التذاكر</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  reviewFilter === 'all' ? 'bg-black/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>
                  {kpis?.total_tickets ?? tickets.length}
                </span>
              </button>

              {/* Tab: Unopened (لم يتم فتح المحادثة) */}
              <button
                onClick={() => setReviewFilter('unopened')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  reviewFilter === 'unopened'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-white dark:bg-[#1E1E24] text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>لم يتم فتح المحادثة</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  reviewFilter === 'unopened' ? 'bg-black/20 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                }`}>
                  {kpis?.unopened_count ?? '--'}
                </span>
              </button>

              {/* Tab: Needs Follow-up (متابعة مع العميل) */}
              <button
                onClick={() => setReviewFilter('needs_followup')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  reviewFilter === 'needs_followup'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white dark:bg-[#1E1E24] text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>متابعة مع العميل</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  reviewFilter === 'needs_followup' ? 'bg-black/20 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                }`}>
                  {kpis?.needs_followup_count ?? '--'}
                </span>
              </button>

              {/* Tab: Reviewed and Handled (تم المراجعة والتعامل) */}
              <button
                onClick={() => setReviewFilter('reviewed_and_handled')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  reviewFilter === 'reviewed_and_handled'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-white dark:bg-[#1E1E24] text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40'
                }`}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>تم المراجعة والتعامل</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  reviewFilter === 'reviewed_and_handled' ? 'bg-black/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {kpis?.reviewed_count ?? '--'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Filter Toolbar */}
        <div className="p-3.5 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#1E1E24]">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-1">
            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث بالاسم، الرقم، التذكرة، أو الرسالة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 rtl:pr-8 rtl:pl-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-orange-500 outline-none"
              />
            </form>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-orange-500 outline-none"
            >
              <option value="all">جميع الفئات</option>
              <option value="technical">Technical (فني وراوتر)</option>
              <option value="billing">Billing (فواتير ورصيد)</option>
              <option value="plan inquiry">Plan Inquiry (باقات وعروض)</option>
              <option value="service request">Service Request (خدمات وشرائح)</option>
              <option value="other">Other (أخرى)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-orange-500 outline-none"
            >
              <option value="all">جميع حالات التصعيد</option>
              <option value="resolved">محلولة ذاتياً (Resolved)</option>
              <option value="escalated">تم التصعيد لمشرف (Escalated)</option>
            </select>
          </div>

          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            اضغط على أي تذكرة لمشاهدة <span className="text-[#FF7900] font-bold">الجلسة الكاملة</span> وبيانات العميل
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left rtl:text-right text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap">رقم التذكرة</th>
                <th className="py-3.5 px-4 whitespace-nowrap">العميل وبياناته</th>
                <th className="py-3.5 px-4 whitespace-nowrap">الباقة والمنطقة</th>
                <th className="py-3.5 px-4 whitespace-nowrap">الفئة</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-center">أداء ورضا العميل</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-center">حالة المراجعة</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-center">التصعيد</th>
                <th className="py-3.5 px-4 whitespace-nowrap">التاريخ</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"></div>
                      <span>جارِ تحميل سجل التذاكر والمراجعات...</span>
                    </div>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-gray-400">
                    لا توجد تذاكر مطابقة لخيارات الفلترة الحالية.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => {
                  const emoBadge = getEmotionBadge(t.customer_emotion, t.sentiment);
                  const revBadge = getReviewBadge(t.review_status);
                  const RevIcon = revBadge.icon;

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="hover:bg-orange-50/20 dark:hover:bg-orange-950/10 cursor-pointer transition-colors group"
                    >
                      {/* Ticket ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#FF7900] whitespace-nowrap">
                        {t.id}
                      </td>

                      {/* Customer Name & Phone */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{t.customer_name || 'احمد اسامه'}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                          <span dir="ltr">{t.customer_phone || '01288997766'}</span>
                          <span className="text-gray-300 dark:text-gray-700">•</span>
                          <span className="font-semibold">{t.customer_id}</span>
                        </div>
                      </td>

                      {/* Plan & Region */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {t.customer_plan || 'Home DSL 400 GB'}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-orange-500/70 shrink-0" />
                          <span>{t.region || 'Giza'}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 capitalize text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-[11px]">
                          {t.category}
                        </span>
                      </td>

                      {/* Customer Emotion & Satisfaction Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${emoBadge.bg}`}>
                          {emoBadge.label}
                        </span>
                      </td>

                      {/* Review Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm ${revBadge.bg}`}>
                          <RevIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{revBadge.label}</span>
                        </span>
                      </td>

                      {/* Escalation Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                          t.escalated 
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {t.escalated ? 'تصعيد لمشرف' : 'محلولة بالذكاء'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 text-xs font-mono whitespace-nowrap" dir="ltr">
                        {t.created_at?.slice(0, 16).replace('T', ' ')}
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(t);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-[#FF7900] hover:bg-[#FF7900] hover:text-white transition-all text-xs font-bold whitespace-nowrap shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>مراجعة</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details & Full Session Audit Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-white dark:bg-[#1E1E24] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/70 dark:bg-gray-900/60">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-mono font-extrabold text-[#FF7900] px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  {selectedTicket.id}
                </span>
                
                {/* Active Review Badge in Header */}
                {(() => {
                  const rev = getReviewBadge(selectedTicket.review_status);
                  const Icon = rev.icon;
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${rev.bg}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{rev.label}</span>
                    </span>
                  );
                })()}

                <span className="text-xs px-2.5 py-1 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold uppercase">
                  {selectedTicket.category}
                </span>
              </div>

              <button 
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Section 1: Customer Profile Details (بيانات الشخص اللي فتح المحادثة) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/5 via-orange-500/10 to-transparent border border-orange-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span>بيانات العميل الموثقة في الجلسة</span>
                  </h4>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    حساب نشط (Active)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-[#18181D] border border-gray-200 dark:border-gray-800 shadow-sm">
                    <span className="text-gray-400 block text-[11px]">اسم العميل</span>
                    <span className="font-extrabold text-gray-900 dark:text-white mt-0.5 block text-sm">
                      {selectedTicket.customer_name || 'احمد اسامه'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#18181D] border border-gray-200 dark:border-gray-800 shadow-sm">
                    <span className="text-gray-400 block text-[11px]">رقم الهاتف</span>
                    <span className="font-bold text-gray-900 dark:text-white mt-0.5 block font-mono text-sm">
                      {selectedTicket.customer_phone || '01288997766'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#18181D] border border-gray-200 dark:border-gray-800 shadow-sm">
                    <span className="text-gray-400 block text-[11px]">الباقة الحالية</span>
                    <span className="font-bold text-[#FF7900] mt-0.5 block truncate">
                      {selectedTicket.customer_plan || 'Home DSL 400 GB (100 Mbps)'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#18181D] border border-gray-200 dark:border-gray-800 shadow-sm">
                    <span className="text-gray-400 block text-[11px]">المحافظة / النطاق</span>
                    <span className="font-bold text-gray-900 dark:text-white mt-0.5 block flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-500" />
                      <span>{selectedTicket.region || 'Giza'}</span>
                      <span className="text-gray-400 font-mono text-[10px]">({selectedTicket.customer_id})</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: AI Customer Satisfaction & Emotion Assessment (تحديد أداء ورضا العميل) */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#18181D] border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    <span>تحليل الذكاء الاصطناعي لأداء ورضا العميل</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Emotion / Mood Card */}
                  {(() => {
                    const emo = getEmotionBadge(selectedTicket.customer_emotion, selectedTicket.sentiment);
                    return (
                      <div className="p-3.5 rounded-xl bg-white dark:bg-[#1E1E24] border border-gray-200 dark:border-gray-800 flex items-center gap-3">
                        <div className="text-2xl">
                          {selectedTicket.customer_emotion === 'satisfied' ? '😊' :
                           selectedTicket.customer_emotion === 'angry' ? '😡' :
                           selectedTicket.customer_emotion === 'frustrated' ? '😠' :
                           selectedTicket.customer_emotion === 'anxious' ? '😟' : '😐'}
                        </div>
                        <div>
                          <span className="text-gray-400 text-[11px] block">حالة العميل النفسية</span>
                          <span className="font-extrabold text-gray-900 dark:text-white text-sm block">
                            {emo.label}
                          </span>
                          <span className={`text-[10px] font-bold ${emo.color}`}>
                            {emo.scoreLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Churn Risk */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#1E1E24] border border-gray-200 dark:border-gray-800">
                    <span className="text-gray-400 text-[11px] block">احتمالية مغادرة الخدمة (Churn Risk)</span>
                    <span className={`font-extrabold text-sm block mt-0.5 ${
                      selectedTicket.escalated ? 'text-red-500' : 'text-emerald-500'
                    }`}>
                      {selectedTicket.escalated ? 'مرتفعة (تتطلب اهتماماً)' : 'منخفضة / مستقرة'}
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      {selectedTicket.escalation_reason || 'العميل يستفسر بشكل طبيعي دون تهديد'}
                    </span>
                  </div>

                  {/* Escalation Required */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#1E1E24] border border-gray-200 dark:border-gray-800">
                    <span className="text-gray-400 text-[11px] block">قرار تصعيد المشرف</span>
                    <span className={`font-extrabold text-sm block mt-0.5 ${
                      selectedTicket.escalated ? 'text-red-500' : 'text-emerald-500'
                    }`}>
                      {selectedTicket.escalated ? 'نعم - يستدعي متابعة هاتفية' : 'لا - محلول بالكامل تلقائياً'}
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      زمن الاستجابة: {selectedTicket.latency_ms ? `${Math.round(selectedTicket.latency_ms)}ms` : '--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Full Session Transcript (الجلسة كاملة) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-orange-500" />
                    <span>الجلسة كاملة وسجل المحادثة بالتفصيل</span>
                  </h4>
                  <span className="text-[11px] text-gray-400">
                    {parseSessionTranscript(selectedTicket).length} رسائل متبادلة
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#18181D] border border-gray-200 dark:border-gray-800 space-y-4 max-h-72 overflow-y-auto">
                  {parseSessionTranscript(selectedTicket).map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div 
                        key={idx} 
                        className={`flex gap-3 text-xs ${isUser ? 'flex-row' : 'flex-row-reverse'}`}
                      >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isUser ? 'bg-orange-100 text-[#FF7900]' : 'bg-gray-800 text-white'
                        }`}>
                          {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-orange-400" />}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[85%] rounded-2xl p-3.5 space-y-1 ${
                          isUser 
                            ? 'bg-white dark:bg-[#1E1E24] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100' 
                            : 'bg-gradient-to-r from-orange-500 to-[#FF7900] text-white shadow-md shadow-orange-500/10'
                        }`}>
                          <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 font-semibold">
                            <span>{isUser ? `العميل (${selectedTicket.customer_name || 'احمد اسامه'})` : 'خدمة عملاء أورنج (Orange AI Support)'}</span>
                            <span className="font-mono">{msg.timestamp?.slice(11, 16) || ''}</span>
                          </div>
                          <p className="whitespace-pre-line leading-relaxed text-xs">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: Supervisor Action & Audit Center (أزرار تم المراجعة والتعامل أو متابعة مع العميل) */}
              <div className="p-5 rounded-2xl bg-gray-100/70 dark:bg-[#18181D] border border-gray-300 dark:border-gray-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4 text-emerald-500" />
                    <span>مركز تدقيق واعتماد التذكرة من قبل المشرف</span>
                  </h4>
                  {selectedTicket.reviewed_at && (
                    <span className="text-[11px] text-gray-500 font-mono">
                      آخر تحديث: {selectedTicket.reviewed_at.slice(0, 16).replace('T', ' ')}
                    </span>
                  )}
                </div>

                {/* The 3 Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Button 1: Reviewed and Handled */}
                  <button
                    onClick={() => handleUpdateReviewStatus(selectedTicket.id, 'reviewed_and_handled')}
                    disabled={updatingReview}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all shadow-md ${
                      selectedTicket.review_status === 'reviewed_and_handled'
                        ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                    }`}
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>تم المراجعة والتعامل مع العميل</span>
                  </button>

                  {/* Button 2: Needs Follow-up */}
                  <button
                    onClick={() => handleUpdateReviewStatus(selectedTicket.id, 'needs_followup')}
                    disabled={updatingReview}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all shadow-md ${
                      selectedTicket.review_status === 'needs_followup'
                        ? 'bg-blue-600 text-white shadow-blue-600/30 ring-2 ring-blue-400'
                        : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20'
                    }`}
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>متابعة مع العميل</span>
                  </button>

                  {/* Button 3: Unopened */}
                  <button
                    onClick={() => handleUpdateReviewStatus(selectedTicket.id, 'unopened')}
                    disabled={updatingReview}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all border ${
                      selectedTicket.review_status === 'unopened'
                        ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950/60 dark:text-amber-300 ring-2 ring-amber-400'
                        : 'bg-white dark:bg-[#1E1E24] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Inbox className="w-4 h-4 text-amber-500" />
                    <span>لم يتم فتح المحادثة</span>
                  </button>
                </div>

                {/* Supervisor Notes Textarea */}
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 block">
                    ملاحظات المشرف وتفاصيل التعامل (Supervisor Notes):
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={reviewerNotesInput}
                      onChange={(e) => setReviewerNotesInput(e.target.value)}
                      placeholder="اكتب هنا ما تم مع العميل (مثال: تم الاتصال به هاتفياً والتأكد من استقرار سرعة النت)..."
                      className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E1E24] text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-orange-500 outline-none resize-none"
                    />
                    <button
                      onClick={handleSaveNotes}
                      disabled={updatingReview}
                      className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all"
                    >
                      <Save className="w-4 h-4 text-orange-400" />
                      <span>حفظ</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-[#18181D]">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                الحالة الحالية: <strong className="text-gray-900 dark:text-white">{getReviewBadge(selectedTicket.review_status).label}</strong>
              </span>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold transition-all"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
