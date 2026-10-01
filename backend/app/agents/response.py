from pathlib import Path
from typing import Optional, List, Dict, Any
from app.config import settings
from app.schemas import ResponseOutput, RetrievalOutput, ClassificationOutput, SentimentRiskOutput
from app.services.llm_factory import call_llm_structured

PROMPT_FILE = settings.PROMPTS_DIR / "response.txt"

async def run_response_agent(
    message: str,
    classification: ClassificationOutput,
    sentiment_risk: SentimentRiskOutput,
    retrieval: RetrievalOutput,
    customer_id: str = "CUST-1001",
    customer_name: Optional[str] = None,
    customer_phone: Optional[str] = None,
    customer_plan: Optional[str] = None,
    region: str = "Cairo",
    conversation_history: Optional[List[Dict[str, Any]]] = None,
    qa_feedback: Optional[str] = None
) -> ResponseOutput:
    if PROMPT_FILE.exists():
        system_prompt = PROMPT_FILE.read_text(encoding="utf-8")
    else:
        system_prompt = "You are the Orange Telecom Response Agent. Draft a helpful reply."

    acc_name = customer_name or (retrieval.customer_account.name if retrieval.customer_account else "أحمد أسامة")
    acc_phone = customer_phone or (retrieval.customer_account.phone if retrieval.customer_account else "01234567890")
    acc_plan = customer_plan or (retrieval.customer_account.plan_name if retrieval.customer_account else "Home DSL 140 GB")

    is_identity_request = any(w in message for w in [
        "تعرفني", "تعرف مين انا", "تعرف مين أنا", "انا مين", "أنا مين", "اسمي ايه", "اسمي إيه",
        "رقمي كام", "رقم خطي", "رقمي ايه", "رقمي إيه", "انا على باقه ايه", "انا على باقة ايه", "باقتي ايه", "باقتي إيه",
        "منطقتي ايه", "منطقتي إيه", "بياناتي", "بياناتي المسجلة", "who am i", "my info", "my profile"
    ])

    if is_identity_request:
        return ResponseOutput(
            reply_text=(
                f"أهلاً بك يا أستاذ {acc_name}! بالتأكيد مسجل لدي في النظام كافة بيانات حسابك المعتمدة:\n\n"
                f"👤 الاسم: {acc_name}\n"
                f"📱 رقم الهاتف: {acc_phone}\n"
                f"📶 الباقة المشترك بها: {acc_plan}\n"
                f"📍 المنطقة: {region}\n"
                f"✅ حالة الخط: نشط (Active)\n\n"
                f"أنا في خدمتك دائماً، هل تود الاستفسار عن باقتك أو الاستفادة من عروض أورنج الجديدة؟"
            ),
            suggested_actions=[f"الاستعلام عن تفاصيل باقة {acc_plan}", "إدارة الحساب عبر تطبيق My Orange", "الاطلاع على أحدث عروض أورنج"],
            estimated_resolution_time="فوري"
        )

    account_info = (
        f"Verified Customer Identity: Name: {acc_name}, Phone: {acc_phone}, Plan: {acc_plan}, Region: {region}, Status: Active "
        f"(SECURITY NOTICE: Direct monetary balance amount is withheld. If user asks for monetary balance, direct to My Orange app or #100#)"
    )

    net_info = ""
    if retrieval.network_status:
        net = retrieval.network_status
        net_info = f"Region: {net.region}, Status: {net.status}, Details: {net.details}"

    # Build conversation memory context
    history_context = ""
    if conversation_history:
        turns = []
        for msg_item in conversation_history[-6:]:
            role = "العميل" if msg_item.get("sender") == "user" else "خدمة عملاء أورنج"
            txt = msg_item.get("text", "")
            turns.append(f"{role}: {txt}")
        if turns:
            history_context = "\n[ذاكرة وسياق المحادثة السابقة / Recent Conversation Memory]:\n" + "\n".join(turns) + "\n"

    feedback_directive = ""
    if qa_feedback:
        feedback_directive = f"\n[CRITICAL QA REVISION REQUIRED]: A previous draft failed QA with feedback: '{qa_feedback}'. Revise the response to strictly resolve this concern."

    user_prompt = f"""{system_prompt}

IMPORTANT OPERATIONAL DIRECTIVES:
1. MANDATORY CUSTOMER IDENTITY & PROFILE CONFIRMATION:
   - When the customer asks about their identity, name, phone, plan, region, or registered data ("أنا مين؟", "اسمي إيه؟", "رقمي كام؟", "أنا على باقة إيه؟", "منطقتي إيه؟", "تعرف بياناتي؟", "تعرفني؟", "مين انا"):
   - You MUST explicitly greet them by name and confirm their registered profile details clearly in Arabic:
     * أهلاً بك يا أستاذ {acc_name}! بياناتك المسجلة لدينا في أورنج هي:
     * الاسم: {acc_name}
     * رقم الهاتف: {acc_phone}
     * الباقة المشترك بها: {acc_plan}
     * المنطقة: {region}
     * حالة الحساب/الخط: نشط (Active)
   - DO NOT refuse or withhold their name, phone, or plan! The customer is authenticated in this chat. (Only monetary cash balance amount is withheld per balance privacy policy).

2. CONVERSATION MEMORY:
   - If the customer asks what they asked earlier, or refers to earlier discussion ("انت فاكر كنت بسألك عن إيه من شوية؟", "كنا بنتكلم في إيه؟", "سؤالي اللي فات"):
   - Inspect the conversation memory below and answer them accurately about what was discussed previously!

{history_context}

Customer Inquiry: "{message}"
Detected Category: {classification.category} | Priority: {classification.priority} | Customer Language: {classification.language}
Sentiment: {classification.sentiment} (Emotion: {sentiment_risk.primary_emotion}, Recommended Tone: {sentiment_risk.recommended_tone})

Account Context:
{account_info}

Network Node Status:
{net_info}

Retrieved Knowledge Context:
{retrieval.rag_context}
{feedback_directive}
"""

    result = await call_llm_structured(
        prompt=user_prompt,
        schema=ResponseOutput,
        agent_type="response",
        context={
            "message": message,
            "category": classification.category,
            "customer_id": customer_id,
            "customer_name": acc_name,
            "customer_phone": acc_phone,
            "customer_plan": acc_plan,
            "region": region,
            "conversation_history": conversation_history or []
        }
    )
    return result
