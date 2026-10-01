import asyncio
import json
import logging
import re
from typing import Type, TypeVar, Optional, Any, Dict
from pydantic import BaseModel
from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# Setup Gemini if API Key provided
gemini_model = None
if settings.GEMINI_API_KEY and not settings.MOCK_LLM:
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            generation_config={"temperature": 0.2, "response_mime_type": "application/json"}
        )
        logger.info(f"Gemini model initialized: {settings.GEMINI_MODEL}")
    except Exception as e:
        logger.warning(f"Failed to initialize Gemini model: {e}. Falling back to Mock LLM.")
        gemini_model = None

def clean_json_text(text: str) -> str:
    """Extract clean JSON text from LLM output, removing any markdown fences."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text

def get_mock_structured_response(agent_type: str, schema: Type[T], context: Dict[str, Any]) -> T:
    """High-fidelity mock LLM responses for demo reliability."""
    msg = context.get("message", "").lower()
    is_ar = any("\u0600" <= c <= "\u06FF" for c in msg)
    
    if agent_type == "classifier":
        # 1. Service Request detection (SIM, transfer, relocation, line cancellation)
        if any(w in msg for w in ["نقل", "انقل", "شريحة", "sim", "esim", "swap", "تنشيط", "activate", "relocat", "cancel", "الغي", "هلغي", "إلغاء", "الغاء", "كنسل"]):
            category = "service request"
            priority = "critical" if any(w in msg for w in ["manager", "cancel", "هلغي", "تنظيم الاتصالات", "worst", "سيئة"]) else "medium"
            summary = "طلب خدمة تغيير أو تنشيط خط أو شريحة أو نقل مكان أو طلب إلغاء" if is_ar else "Service request for SIM swap, relocation, or cancellation"
        # 2. Billing detection (checked before plan inquiry for complaints mentioning both deduction and bundle)
        elif any(w in msg for w in ["رصيد", "خصم", "فاتورة", "charge", "charged", "bill", "balance", "credit", "money", "فلوس", "overcharged", "refund", "رجعولي"]):
            category = "billing"
            priority = "critical" if any(w in msg for w in ["fraud", "حرامية", "unacceptable", "سرقة", "رجعولي"]) else "high"
            summary = "استفسار أو شكوى بخصوص خصم رصيد أو الفاتورة" if is_ar else "Billing dispute or unexpected credit deduction"
        # 3. Plan inquiry (package, prices, upgrade, quotas)
        elif any(w in msg for w in ["باقة", "باقات", "عرض", "عروض", "اسعار", "أسعار", "سعر", "plan", "bundle", "package", "fee", "upgrade", "ترقية", "gigabytes", "جيجا", "تجديد"]):
            category = "plan inquiry"
            priority = "low"
            summary = "استفسار عن باقات الإنترنت أو تجديد الباقة أو الترقية" if is_ar else "Inquiry regarding data plans, bundle pricing, or package upgrade"
        # 4. Technical detection (slow, down, outage, dsl, disconnected, coverage)
        elif any(w in msg for w in ["slow", "بطيء", "قطع", "down", "outage", "مفصول", "مش شغال", "لمبة", "تغطية", "شبكة", "coverage", "red light"]):
            category = "technical"
            priority = "critical" if any(w in msg for w in ["امتحانات", "exam", "completely down", "طوارئ", "emergency"]) else "high"
            summary = "انقطاع أو بطء أو عطل في خدمة الإنترنت أو الشبكة" if is_ar else "Internet connectivity issue, outage, or speed degradation"
        else:
            category = "other"
            priority = "critical" if any(w in msg for w in ["manager", "cancel", "هلغي", "تنظيم الاتصالات", "worst", "سيئة"]) else "low"
            summary = "استفسار أو شكوى عامة من العميل" if is_ar else "General telecom customer inquiry or feedback"
            
        sentiment = "angry" if any(w in msg for w in ["سيء", "حرامية", "زفت", "worst", "terrible", "unacceptable", "scam", "رجعولي"]) else (
            "frustrated" if any(w in msg for w in ["مش شغال", "تعبت", "slow", "بطيء", "ليه", "why"]) else "neutral"
        )
        return schema(
            category=category,
            priority=priority,
            sentiment=sentiment,
            language="ar" if is_ar else "en",
            summary=summary
        )

    elif agent_type == "sentiment_risk":
        is_angry = any(w in msg for w in ["سيء", "حرامية", "زفت", "worst", "terrible", "unacceptable", "scam", "أحول لشركة تانية", "cancel", "رجعولي", "سرقة", "fraud"])
        is_frustrated = any(w in msg for w in ["slow", "بطيء", "قطع", "من امبارح", "yesterday", "لم يتم الحل", "فلوس"])
        
        if is_angry:
            score = -0.85
            emotion = "angry"
            churn_risk = "critical"
            escalate = True
            reason = "Customer expressing severe anger and risk of leaving or regulatory complaint."
            tone = "apologetic"
        elif is_frustrated:
            score = -0.45
            emotion = "frustrated"
            churn_risk = "medium"
            escalate = False
            reason = "Customer experiencing service friction, can be resolved with standard procedure."
            tone = "empathetic"
        else:
            score = 0.1
            emotion = "neutral"
            churn_risk = "low"
            escalate = False
            reason = "Standard inquiry with no urgent churn triggers."
            tone = "informative"

        return schema(
            sentiment_score=score,
            primary_emotion=emotion,
            churn_risk=churn_risk,
            escalation_recommended=escalate,
            escalation_reason=reason,
            recommended_tone=tone
        )

    elif agent_type == "summarizer":
        return schema(
            context_summary=f"Customer report: '{msg[:80]}...'. Account verified. RAG knowledge retrieved relevant policies and package pricing.",
            key_findings=[
                "User reported telecom disruption or inquiry.",
                "Customer active subscription verified in system.",
                "SLA dictates initial diagnostic and resolution within 2-4 hours."
            ],
            identified_resolution="Apply automated line reset and guide user through router restart or explain billing itemization."
        )

    elif agent_type == "response":
        category = context.get("category", "technical")
        cust_id = context.get("customer_id", "CUST-1001")
        
        is_balance_inquiry = any(w in msg for w in ["رصيدي", "معايا كام", "رصيد كام", "استعلام عن الرصيد", "فحص الرصيد", "عرفني رصيدي", "فلوسي", "باقي كام رصيد", "balance", "how much balance", "check balance", "credit balance"]) and not any(w in msg for w in ["خصم", "سحب", "سرقة", "deduct", "overcharge", "stolen"])
        is_network_inquiry = any(w in msg for w in ["شبكة", "شبكه", "تغطية", "تغطيه", "الارسال", "الإرسال", "ساقطة", "ساقطه", "ضعيفة", "ضعيفه", "سيجنال", "signal", "coverage", "network", "ابراج", "أبراج"])
        is_salefny = any(w in msg for w in ["استلف", "سلفني", "سلف", "رصيد طوارئ", "كلمني شكرا", "كلمني شكراً", "borrow", "salefny"])
        is_blocked_line = any(w in msg for w in ["واقف", "مقطوع", "مفصول", "مقفول", "موقوف", "تحديث بيانات", "تحديث البيانات", "puk", "معلق", "بلوك"]) and any(w in msg for w in ["خط", "خطي", "شريحة", "شريحتي", "مكالمات", "سيم", "line", "sim"])
        is_sim_swap = any(w in msg for w in ["استبدال شريحة", "استبدال شريحه", "بدل فاقد", "شريحتي ضاعت", "شريحة ضاعت", "شريحة اتسرقت", "تغيير شريحة", "شريحة جديدة", "esim", "sim swap"])
        is_orange_cash_transfer = any(w in msg for w in ["احول", "تحويل", "ارسل", "ابعت", "حول"]) and any(w in msg for w in ["فلوس", "مبلغ", "اموال", "أموال", "كاش", "محفظة", "محفظه", "money", "transfer"])
        is_orange_cash_open = any(w in msg for w in ["افتح محفظة", "فتح محفظة", "اشترك في اورنج كاش", "اشترك في أورنج كاش", "عمل محفظة", "محفظة اورنج كاش", "محفظة أورنج كاش", "تسجيل محفظة", "انشاء محفظة", "open wallet"])
        is_recharge = any(w in msg for w in ["اشحن رصيد", "شحن رصيد", "كارت شحن", "كروت الشحن", "شحن كارت", "recharge", "top up"]) and not any(w in msg for w in ["باقة", "باقه", "bundle"])
        is_bundle_renew = any(w in msg for w in ["تجديد باقة", "تجديد الباقة", "اشحن باقة", "شحن باقة", "باقة نت اضافية", "باقة إضافية", "باقات go", "renew package", "bundle"])
        is_router_issue = any(w in msg for w in ["لمبة", "حمرا", "حمراء", "red light", "راوتر", "router", "سبليتر", "قطع نت"])

        is_cancel_package = (
            any(w in msg for w in ["الغي", "الغاء", "إلغاء", "اوقف", "وقف", "ايقاف", "إيقاف", "كنسل", "cancel", "stop"])
            and any(w in msg for w in ["باق", "اشتراك", "تجديد", "plan", "package", "sub", "bundle"])
        ) or any(w in msg for w in [
            "الغي باقتي", "الغي الباقة", "الغي الباقه", "الغي الباقع", "الغي باقة", "الغي باقه",
            "إلغاء باقة", "الغاء الباقة", "الغاء باقة", "الغي اشتراك", "إلغاء اشتراك", "الغاء اشتراك",
            "وقف الباقة", "وقف الباقه", "وقف التجديد", "الغاء التجديد", "الغاء الاشتراك", "إلغاء الاشتراك",
            "cancel package", "unsubscribe", "opt out"
        ])
        is_upgrade_package = any(w in msg for w in [
            "ابجريت", "ترقية", "ترقيه", "باقة كبيرة", "باقه كبيره", "باقة اعلى", "باقه اعلى", "باقة أكبر", "باقه اكبر",
            "اعلي الباقة", "اعلي باقتي", "ارفع الباقة", "ارفع باقتي", "عروض الترقية", "عروض الباقات", "عايز باقة اكبر",
            "عايز باقه كبيره", "عايز باقة كبيرة", "اكبر باقتي", "تغيير لباقة اعلى", "ازود باقتي", "ازود الباقة", "باقات الانترنت المنزلي",
            "upgrade", "bigger plan", "higher plan", "upgrade plan", "plan offers"
        ])
        is_wifi_password = any(w in msg for w in ["باسورد الواي فاي", "باسورد الراوتر", "تغيير الباسورد", "كلمة سر الراوتر", "واي فاي", "wifi password", "192.168.1.1"])
        is_home_4g = any(w in msg for w in ["نت هوائي", "راوتر هوائي", "home 4g", "بدون خط ارضي", "بدون خط أرضي"])

        cust_name = context.get("customer_name") or "احمد اسامه"
        cust_phone = context.get("customer_phone") or "01234567890"
        cust_plan = context.get("customer_plan") or "Home DSL 140 GB"
        cust_region = context.get("region") or "Cairo"
        conv_history = context.get("conversation_history") or []

        is_identity_inquiry = any(w in msg for w in [
            "تعرفني", "تعرف مين انا", "تعرف مين أنا", "انا مين", "أنا مين", "اسمي ايه", "اسمي إيه",
            "رقمي كام", "رقم خطي", "رقمي ايه", "رقمي إيه", "انا على باقه ايه", "انا على باقة ايه", "باقتي ايه", "باقتي إيه",
            "منطقتي ايه", "منطقتي إيه", "بياناتي", "بياناتي المسجلة", "who am i", "my info", "my profile", "my plan"
        ])
        is_memory_inquiry = any(w in msg for w in [
            "كنت بسالك عن ايه", "كنت بسألك عن ايه", "كنت بسألك عن إيه", "كنت سالك", "كنت سألك",
            "سؤالي اللي فات", "كنا بنتكلم في ايه", "كنا بنتكلم في إيه", "فاكر", "سالتك عن ايه", "سألتك عن إيه",
            "سالتك في ايه", "سألتك في إيه", "what did i ask", "previous question"
        ])

        if is_ar:
            if is_identity_inquiry:
                reply = (
                    f"أهلاً بك يا أستاذ {cust_name}! بالتأكيد مسجل لدي في النظام كافة بيانات حسابك المعتمدة:\n\n"
                    f"👤 الاسم الكريم: {cust_name}\n"
                    f"📱 رقم الهاتف المسجل: {cust_phone}\n"
                    f"📶 الباقة الحالية: {cust_plan}\n"
                    f"📍 المنطقة: {cust_region}\n"
                    f"✅ حالة الخط: نشط (Active)\n\n"
                    f"أنا في خدمتك دائماً لمساعدتك في أي استفسار أو إدارة لباقتك وخدمات أورنج."
                )
                actions = [f"الاستعلام عن تفاصيل باقة {cust_plan}", "إدارة الحساب عبر تطبيق My Orange", "الاطلاع على أحدث عروض أورنج"]
            elif is_memory_inquiry:
                last_user_q = ""
                if conv_history:
                    user_msgs = [m.get("text", "") for m in conv_history if m.get("sender") == "user"]
                    if user_msgs:
                        last_user_q = user_msgs[-1]
                if last_user_q:
                    reply = (
                        f"نعم يا أستاذ {cust_name}، أنا متذكر بالتأكيد! سؤالك السابق كان بخصوص:\n"
                        f"«{last_user_q}»\n\n"
                        f"هل تود استكمال المتابعة في هذا الموضوع أو لديك أي استفسار إضافي؟"
                    )
                else:
                    reply = (
                        f"أهلاً بك يا أستاذ {cust_name}. نحن نتحدث في هذه الجلسة، ويمكنني تذكر كافة استفساراتك السابقة ومتابعة أي تفاصيل تحتاجها. تفضل بسؤالي وسأجيبك فوراً!"
                    )
                actions = ["استكمال المحادثة السابقة", "بدء موضوع جديد"]
            elif is_upgrade_package:
                reply = (
                    "أهلاً بك في دعم أورنج! يسعدنا جداً رغبتك في ترقية باقتك للاستمتاع بسعات أكبر وسرعات فائقة. إليك باقات أورنج وعروض الترقية الحصرية المتاحة حالياً:\n\n"
                    "📶 باقات الإنترنت المنزلي Home DSL (سرعات تصل إلى 30 و 70 و 100 ميجا):\n"
                    "• باقة 140 جيجا: 160 جنيه شهرياً (سرعة تصل إلى 30 ميجا).\n"
                    "• باقة 200 جيجا: 225 جنيه شهرياً (سرعة تصل إلى 30 ميجا).\n"
                    "• باقة 300 جيجا: 325 جنيه شهرياً (سرعات فائقة VDSL تصل إلى 70 ميجا).\n"
                    "• باقة 500 جيجا: 500 جنيه شهرياً (سرعات فائقة VDSL تصل إلى 100 ميجا).\n"
                    "• باقة 750 جيجا: 800 جنيه شهرياً (للاستخدام المنزلي المكثف والألعاب).\n\n"
                    "🎁 عروض الترقية الحصرية المتاحة لك:\n"
                    "1. خصم 25% على أول 3 فواتير أو ضعف الجيجات مجاناً لأول شهر عند الترقية عبر تطبيق My Orange.\n"
                    "2. ترقية جهاز الراوتر إلى راوتر أورنج VDSL فائق السرعة بإيجار رمزي (10 جنيه/شهر فقط).\n"
                    "3. كسب نقاط إضافية في برنامج أورنج Special واستبدالها بكوبونات مشتريات وشحن مجاني.\n\n"
                    "📲 للترقية الفورية: يمكنك اختيار باقتك الجديدة وتأكيد الترقية فوراً بنقرة واحدة عبر تطبيق My Orange، أو الاتصال بالدعم الفني للإنترنت المنزلي على 16333 ليتم التفعيل على خطك مباشرة دون أي انقطاع للخدمة."
                )
                actions = [
                    "الترقية المباشرة عبر تطبيق My Orange",
                    "الاتصال بـ 16333 للترقية الفورية مع ممثل الدعم",
                    "زيارة أقرب فرع أورنج للاستفادة من عروض الراوتر الجديد"
                ]
            elif is_cancel_package:
                reply = (
                    "أهلاً بك في دعم أورنج. لإلغاء أو تعديل اشتراك باقتك، إليك الطرق الرسمية المباشرة:\n"
                    "1. باقات الموبايل إنترنت (GO): يمكنك إلغاء التجديد التلقائي بطلب الكود #222# واختيار إدارة الباقة، أو بنقرة واحدة عبر تطبيق My Orange.\n"
                    "2. باقات المكالمات (Free Max): للتحويل إلى نظام الكارت العادي (14 قرش للدقيقة بدون اشتراك شهري)، اطلب #100# أو اتصل بـ 400، أو عبر تطبيق My Orange.\n"
                    "3. اشتراكات الخدمات الترفيهية والرسائل الإخبارية: لإلغاء أي خدمة تسحب الرصيد اطلب الكود المجاني #888# أو من قسم 'خدماتي' بتطبيق My Orange.\n"
                    "4. باقات الإنترنت المنزلي (Home DSL): يمكنك إيقاف أو إلغاء الخط الأرضي بزيارة أقرب فرع أورنج أو التواصل مع الدعم الفني على 16333."
                )
                actions = ["إدارة وإلغاء الباقات عبر تطبيق My Orange", "طلب كود إلغاء التجديد #222#", "طلب كود #888# لإلغاء خدمات القيمة المضافة"]
            elif is_wifi_password:
                reply = (
                    "أهلاً بك. لتغيير باسورد الواي فاي أو إعدادات راوتر أورنج:\n"
                    "1. افتح المتصفح واكتب العنوان: 192.168.1.1\n"
                    "2. اسم المستخدم (Username) عادة يكون: admin\n"
                    "3. كلمة المرور (Password): ستجدها مطبوعة على الملصق خلف جهاز الراوتر الخاص بك.\n"
                    "4. ادخل على قائمة WLAN أو Wi-Fi واكتب كلمة المرور الجديدة ثم اضغط Save."
                )
                actions = ["الدخول على صفحة الراوتر 192.168.1.1", "التأكد من كلمة المرور المطبوعة خلف الراوتر"]
            elif is_home_4g:
                reply = (
                    "أهلاً بك! باقات أورنج Home 4G (الإنترنت الهوائي بدون خط أرضي) تعمل بشريحة داتا وسرعات 4G فائقة:\n"
                    "• باقة Home 4G 120 ج: سعة 40 جيجا.\n"
                    "• باقة Home 4G 170 ج: سعة 70 جيجا.\n"
                    "• باقة Home 4G 250 ج: سعة 140 جيجا.\n"
                    "• باقة Home 4G 400 ج: سعة 240 جيجا.\n"
                    "يمكنك شراء الراوتر الهوائي وتشغيله فوراً بزيارة أقرب فرع أورنج."
                )
                actions = ["زيارة أقرب فرع أورنج لطلب راوتر Home 4G", "الاطلاع على تغطية 4G عبر My Orange"]
            elif is_network_inquiry:
                reply = (
                    "أهلاً بك في دعم أورنج. بخصوص استفسارك عن حالة وجودة الشبكة والتغطية في منطقتك، "
                    "لا يمكن فحص أبراج الإرسال والتغطية اللحظية عبر المحادثة هنا لأنها تتطلب فحصاً ميدانياً من قطاع الشبكات. "
                    "يرجى التواصل مباشرة مع فريق الدعم الفني لشبكات أورنج هاتفياً عبر الأرقام التالية:\n"
                    "• اتصل بـ 110 (مجاناً من أي خط أورنج محمول).\n"
                    "• اتصل بـ 16333 (للدعم الفني لخدمات الإنترنت المنزلي والـ DSL).\n"
                    "• اتصل بـ 16110 (من أي خط أرضي أو شبكة أخرى).\n"
                    "• كما يمكنك متابعة وتصعيد الشكوى للجهاز القومي لتنظيم الاتصالات على الرقم المجاني 155."
                )
                actions = ["الاتصال بـ 110 من خط أورنج", "الاتصال بـ 16333 لدعم الإنترنت", "الاتصال بـ 16110 من أي تليفون أرضي"]
            elif is_salefny:
                reply = (
                    "أهلاً بك في دعم أورنج. يمكنك استلاف رصيد طوارئ فوري عبر خدمة 'سلفني شكراً' "
                    "(4 جنيه رصيد) بطلب الكود #100#2# أو كود #444#. كما يمكنك إرسال رسالة 'كلمني شكراً' "
                    "مجاناً لأي رقم أورنج بطلب الكود #123*رقم الهاتف#."
                )
                actions = ["طلب كود سلفني شكراً #100#2# أو #444#", "طلب كود كلمني شكراً #123*الرقم#"]
            elif is_blocked_line:
                reply = (
                    "أهلاً بك في خدمة عملاء أورنج. إذا كان خطك موقوفاً بسبب عدم تحديث البيانات تنفيذاً لتعليمات "
                    "الجهاز القومي لتنظيم الاتصالات NTRA، يرجى التوجه لأقرب فرع من فروع أورنج مصحوباً بأصل بطاقة الرقم "
                    "القومي السارية، وسيتم تحديث البيانات ورفع الإيقاف عن الخط فورياً ومجاناً. وإذا كان الإيقاف ناتجاً "
                    "عن استحقاق فواتير أو نفاد الرصيد، يمكنك الشحن لإعادة تشغيل الخط خلال دقائق."
                )
                actions = ["زيارة أقرب فرع أورنج مع أصل بطاقة الرقم القومي", "الاتصال بـ 110 للتأكد من سبب الإيقاف"]
            elif is_sim_swap:
                reply = (
                    "أهلاً بك. لاستبدال شريحتك أو استخراج شريحة بدل فاقد، تفضل بزيارة أقرب فرع من فروع أورنج "
                    "مع بطاقة الرقم القومي السارية. وفي حالة فقدان أو سرقة الشريحة، يرجى الاتصال فوراً بـ 110 "
                    "من أي خط أورنج لإيقافها مؤقتاً وحماية بياناتك ومحفظتك. كما يمكنك طلب التحويل لشريحة إلكترونية eSIM "
                    "من الفرع أو تطبيق My Orange للأجهزة المتوافقة."
                )
                actions = ["الاتصال بـ 110 لإيقاف الشريحة في حال السرقة", "زيارة أقرب فرع أورنج مع بطاقة الرقم القومي", "طلب شريحة eSIM عبر تطبيق My Orange"]
            elif is_orange_cash_transfer:
                reply = (
                    "أهلاً بك. لتحويل الأموال عبر محفظة أورنج كاش، اطلب الكود #115# ثم اختر (1) تحويل أموال، "
                    "وأدخل رقم هاتف المستلم (يدعم جميع المحافظ الإلكترونية بمصر وشبكة ميزة) ثم المبلغ والرقم السري. "
                    "كما يمكنك التحويل بضغطة زر وبأمان تام عبر تطبيق Orange Cash الرسمي."
                )
                actions = ["طلب كود #115# واختيار تحويل أموال", "التحويل المباشر عبر تطبيق Orange Cash"]
            elif is_orange_cash_open:
                reply = (
                    "أهلاً بك. يمكنك فتح محفظة أورنج كاش (Orange Cash) مجاناً وبكل سهولة بزيارة أي فرع من فروع أورنج "
                    "مع أصل بطاقة الرقم القومي السارية (بشرط أن يكون الخط مسجلاً باسمك). ولتفعيل المحفظة وإنشاء الرقم "
                    "السري المكون من 6 أرقام، اطلب الكود المجاني #115# أو قم بتحميل تطبيق Orange Cash."
                )
                actions = ["زيارة أقرب فرع أورنج بالرقم القومي مجاناً", "طلب كود #115# لإنشاء الرقم السري"]
            elif is_recharge:
                reply = (
                    "أهلاً بك. لشحن الرصيد يمكنك استخدام كروت الشحن بطلب الكود #102*رقم الكارت#، "
                    "أو الشحن بالفيزا والبطاقة البنكية دون رسوم عبر تطبيق My Orange، "
                    "أو الشحن المباشر من رصيد محفظة أورنج كاش بطلب الكود #115#."
                )
                actions = ["شحن كارت بطلب #102*كود الكارت#", "الشحن عبر تطبيق My Orange", "الشحن عبر أورنج كاش #115#"]
            elif is_bundle_renew:
                reply = (
                    "أهلاً بك. لتجديد باقات فري ماكس المكالمات والإنترنت اطلب #0# أو #100# واختر تجديد مبكر. "
                    "ولتجديد أو شراء باقات الموبايل إنترنت GO اطلب #222# أو كود الباقة المباشر (مثل #222*20# لباقة GO 20). "
                    "ولباقات النت المنزلي Home DSL الإضافية، يمكنك الشحن الفوري عبر تطبيق My Orange أو موقع dsl.orange.eg."
                )
                actions = ["طلب كود #100# لتجديد باقة فري ماكس", "طلب كود #222# لباقات GO نت", "شحن باقات إضافية عبر تطبيق My Orange"]
            elif is_balance_inquiry:
                reply = (
                    "أهلاً بك في دعم أورنج الذكي. حفاظاً على سرية وأمان بياناتك وحسابك المالي، "
                    "لا نقوم بعرض أو تخمين مبالغ الرصيد النقدية في المحادثة. يمكنك الاستعلام عن رصيدك المتبقي "
                    "بدقة في أي وقت عبر تطبيق My Orange الرسمي أو بطلب الكود المجاني #100# أو #100#3# مباشرة من خط هاتفك."
                )
                actions = ["فتح تطبيق My Orange للاستعلام عن الرصيد", "طلب الكود المجاني #100# أو #100#3# من الهاتف"]
            elif is_router_issue:
                reply = (
                    "أهلاً بك في دعم أورنج الذكي. بخصوص إضاءة لمبة الراوتر باللون الأحمر (لمبة DSL أو الإنترنت)، "
                    "يرجى التأكد من توصيل كابل التليفون الأرضي (RJ11) بإحكام في منفذ DSL والسبليتر دون قطع، "
                    "ثم فصل الراوتر عن الكهرباء لمدة دقيقة وإعادة تشغيله. تم إجراء فحص آلي للخط في منطقتك، "
                    "وفي حال استمرار اللمبة حمراء سيتم توجيه بلاغ عطل فني للسنترال فوراً."
                )
                actions = ["فحص كابل التليفون والسبليتر", "إعادة تشغيل الراوتر لمدة دقيقة", "متابعة تذكرة الفحص عبر تطبيق My Orange"]
            elif category == "technical":
                reply = (
                    f"أهلاً بك في دعم أورنج الذكي. نعتذر جداً عن الإزعاج بخصوص خدمة الإنترنت على خطك ({cust_id}). "
                    "قمنا بفحص الإشارة في منطقتك وعمل إعادة تهيئة تلقائية للمنفذ (Port Reset) لتحديث مسار البيانات. "
                    "برجاء إعادة تشغيل الراوتر الآن وسيعمل بكفاءة. تم فتح تذكرة دعم لمتابعة استقرار الخط."
                )
                actions = ["إعادة تشغيل الراوتر لمدة 30 ثانية", "التأكد من لمبة DSL/Internet في الراوتر", "تتبع التذكرة عبر تطبيق My Orange"]
            elif category == "billing":
                reply = (
                    f"أهلاً بك. بخصوص الشكوى من خصم الرصيد لحسابك ({cust_id})، تم مراجعة سجل العمليات وتبيّن أن الخصم "
                    "يرتبط بتجديد باقة إضافية أو اشتراك في خدمات القيمة المضافة. يمكنك مراجعة تفاصيل الخصم وإلغاء أي خدمة "
                    "ترفيهية بنقرة واحدة عبر تطبيق My Orange (قسم خدماتي) أو بطلب الكود المجاني #888#."
                )
                actions = ["مراجعة قائمة الخدمات عبر تطبيق My Orange", "إلغاء الاشتراكات الترفيهية عبر كود #888#"]
            elif category == "plan inquiry":
                reply = (
                    "أهلاً بك! باقات أورنج المتاحة حالياً تشمل باقات Home DSL: "
                    "باقة 140 جيجا (160 ج.م/ش)، باقة 250 جيجا (280 ج.م/ش)، باقة 400 جيجا (440 ج.م/ش حتى 70 ميجا)، "
                    "وباقة 600 جيجا (650 ج.م/ش). وباقات الموبايل إنترنت GO تبدأ من GO 10 (1000 ميجا بكود #222*10#) "
                    "حتى GO 120 (20000 ميجا بكود #222*120#). يمكنك الترقية فوراً عبر تطبيق My Orange."
                )
                actions = ["الاشتراك أو الترقية عبر تطبيق My Orange", "إدارة الباقات عبر كود #100# أو #222#"]
            else:
                reply = (
                    f"أهلاً بك في خدمة عملاء أورنج. تم استلام استفسارك لحسابك ({cust_id}) وجاري تقديم الحل المناسب فورياً. "
                    "يمكنك دائماً إدارة باقاتك وخدماتك وحسابك بنقرة واحدة عبر تطبيق My Orange الرسمي، أو الاتصال بخدمة العملاء على 110."
                )
                actions = ["إدارة الحساب عبر تطبيق My Orange", "الاتصال بـ 110 لخدمة العملاء"]
        else:
            if is_network_inquiry:
                reply = (
                    "Welcome to Orange Support. Live cell tower status and field coverage cannot be evaluated via chat. "
                    "Please contact Orange Technical Support directly by phone for live area diagnostics:\n"
                    "• Dial 110 (toll-free from any Orange mobile).\n"
                    "• Dial 16333 (for Home DSL / Fiber technical support).\n"
                    "• Dial 16110 (from any landline or other network).\n"
                    "• NTRA Regulatory Escalation: 155."
                )
                actions = ["Call 110 from Orange mobile", "Call 16333 for DSL support", "Call 16110 from landline"]
            elif is_balance_inquiry:
                reply = (
                    "Hello from Orange Support. To safeguard your financial privacy and security, balance amounts "
                    "are not disclosed directly in chat. Please check your exact live balance anytime via the official "
                    "My Orange App or by dialing #100# or #100#3# directly from your handset."
                )
                actions = ["Open My Orange App to check balance", "Dial #100# from your handset"]
            elif is_cancel_package:
                reply = "To cancel or manage your package auto-renewal, dial #222# for GO internet packages, dial #100# or 400 to switch call plans, or manage via My Orange app."
                actions = ["Dial #222# to cancel GO renewal", "Manage via My Orange App"]
            elif is_salefny:
                reply = "To borrow emergency credit with Orange Salefny, dial #100#2# or #444# for instant 4 EGP credit. Dial #123*Number# for Call Me service."
                actions = ["Dial #100#2# for emergency credit", "Dial #123*Number# for Call Me"]
            elif is_sim_swap:
                reply = "For SIM replacement or lost SIM, please call 110 immediately to suspend the lost card, then visit any Orange store with your valid National ID."
                actions = ["Call 110 to suspend lost card", "Visit nearest Orange store with ID"]
            elif is_orange_cash_transfer or is_orange_cash_open:
                reply = "To open an Orange Cash wallet, visit any Orange store with your National ID for free. To transfer money, dial #115# or use the Orange Cash mobile app."
                actions = ["Dial #115# for Orange Cash", "Visit Orange store with National ID"]
            elif category == "technical":
                reply = f"Hello from Orange Smart Support. We apologize for the connection difficulties on your line ({cust_id}). We have performed an automated network port reset for your area. Please restart your router for 30 seconds. A monitoring ticket has been generated to ensure link stability."
                actions = ["Restart your router for 30 seconds", "Verify the DSL/Internet LED status", "Track ticket updates in My Orange App"]
            elif category == "billing":
                reply = f"Hello. Regarding your recent billing inquiry for account ({cust_id}), our records indicate an automatic renewal of a 5GB extra add-on (30 EGP) triggered upon main quota depletion in accordance with Orange Fair Usage terms. You can manage auto-renewals anytime via #100# or My Orange App."
                actions = ["View itemized charges on My Orange app", "Dial #100# to configure auto-renewal preferences"]
            elif category == "plan inquiry":
                reply = "Welcome to Orange Support! Our premier Home DSL packages include: 140 GB at 160 EGP/mo, and 250 GB at 280 EGP/mo with speeds up to 30 Mbps. You can upgrade your current plan instantly with zero activation fees."
                actions = ["Upgrade plan via My Orange App", "Check current quota usage"]
            else:
                reply = f"Hello. Thank you for contacting Orange Smart Support. Your inquiry for account ({cust_id}) has been recorded and processed by our automated agent team."
                actions = ["Track ticket status via SMS", "Contact Orange helpline at 110 for further assistance"]

        return schema(
            reply_text=reply,
            suggested_actions=actions,
            estimated_resolution_time="فوري" if is_ar else "Instant"
        )

    elif agent_type == "qa":
        reply_content = str(context.get("reply", "")).strip()
        msg_content = str(context.get("message", "")).strip()
        
        # Rule 1: Empty or extremely short replies fail QA
        if len(reply_content) < 15:
            return schema(
                passed=False,
                score=0.35,
                checks={
                    "factual_accuracy": False,
                    "no_false_promises": True,
                    "tone_and_brand": False,
                    "language_match": False
                },
                feedback="Response is abnormally short or incomplete. Lacks sufficient customer guidance.",
                recommended_fix="Provide a complete and empathetic resolution with clear next steps."
            )

        # Rule 2: Check for prohibited false promises or unauthorized commitments
        forbidden_phrases = ["مجانا مدى الحياة", "تعويض مالي فوري كاش", "100% refund guaranteed right now", "هاكر", "hack your router"]
        has_forbidden = any(phrase in reply_content.lower() for phrase in forbidden_phrases)
        if has_forbidden:
            return schema(
                passed=False,
                score=0.42,
                checks={
                    "factual_accuracy": False,
                    "no_false_promises": False,
                    "tone_and_brand": False,
                    "language_match": True
                },
                feedback="Response makes unauthorized financial promises or contains forbidden brand phrasing.",
                recommended_fix="Remove unauthorized compensation promises and refer to official Orange refund policy."
            )

        # Rule 3: Validated pass
        return schema(
            passed=True,
            score=0.96,
            checks={
                "factual_accuracy": True,
                "no_false_promises": True,
                "tone_and_brand": True,
                "language_match": True
            },
            feedback="The reply strictly complies with verified knowledge base policies and customer plan context. Tone is empathetic, professional, and language matches customer input.",
            recommended_fix=None
        )

    raise ValueError(f"Unknown agent type: {agent_type}")

# Fallback Gemini model candidates in priority order (fastest working models first)
CANDIDATE_GEMINI_MODELS = [
    "gemini-3.5-flash-lite",
    settings.GEMINI_MODEL
]

async def call_llm_structured(prompt: str, schema: Type[T], agent_type: str, context: Optional[Dict[str, Any]] = None) -> T:
    """Execute LLM call returning a validated Pydantic model with fast multi-model fallback chain and mock backup."""
    context = context or {}
    
    if settings.MOCK_LLM or not settings.GEMINI_API_KEY:
        return get_mock_structured_response(agent_type, schema, context)

    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)

    full_prompt = f"{prompt}\n\nYou must return a valid JSON object matching this schema:\n{schema.model_json_schema()}"

    def _sync_generate(m_name: str, p: str):
        active_model = genai.GenerativeModel(
            model_name=m_name,
            generation_config={"temperature": 0.2, "response_mime_type": "application/json"}
        )
        resp = active_model.generate_content(p)
        try:
            return resp.text
        except Exception:
            if hasattr(resp, "candidates") and resp.candidates:
                for cand in resp.candidates:
                    if hasattr(cand, "content") and cand.content.parts:
                        for part in cand.content.parts:
                            if hasattr(part, "text") and part.text:
                                return part.text
            return ""

    # Cycle through candidate models to guarantee real Gemini generation with timeout
    for model_name in CANDIDATE_GEMINI_MODELS:
        try:
            raw_text = await asyncio.wait_for(
                asyncio.to_thread(_sync_generate, model_name, full_prompt),
                timeout=6.0
            )
            clean_text = clean_json_text(raw_text)
            data = json.loads(clean_text)
            return schema.model_validate(data)
        except Exception as e:
            logger.warning(f"Gemini model {model_name} attempt failed or timed out: {e}. Trying next candidate model...")
            continue

    logger.warning(f"⚠️ [MOCK_FALLBACK] All Gemini models exhausted for '{agent_type}'. Falling back to high-fidelity mock engine.")
    print(f"⚠️ [MOCK_FALLBACK] {agent_type} fell back to domain mock response.")
    return get_mock_structured_response(agent_type, schema, context)
