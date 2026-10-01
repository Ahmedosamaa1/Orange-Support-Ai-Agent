import uuid
from datetime import datetime
from app.schemas import ActionOutput, ResponseOutput, ClassificationOutput, SentimentRiskOutput
from app.database import save_ticket
from app.services.email_service import email_service
from app.services.sheets_service import sheets_service

import json
from typing import Optional, List, Dict, Any

async def run_action_agent(
    ticket_id: str,
    customer_id: str,
    customer_name: str,
    customer_email: str,
    customer_phone: str,
    customer_plan: str,
    region: str,
    message: str,
    classification: ClassificationOutput,
    sentiment_risk: SentimentRiskOutput,
    response: ResponseOutput,
    conversation_history: Optional[List[Dict[str, Any]]] = None,
    qa_passed: bool = True,
    qa_retries: int = 0,
    latency_ms: float = 0.0
) -> ActionOutput:
    """Execute automated downstream actions: ticket storage, email dispatch, escalation alert, sheets sync."""
    
    # 1. Determine escalation status
    is_escalated = (
        sentiment_risk.escalation_recommended or
        sentiment_risk.primary_emotion == "angry" or
        sentiment_risk.churn_risk in ["high", "critical"]
    )
    escalation_reason = sentiment_risk.escalation_reason if is_escalated else None

    # 2. Email customer
    email_result = email_service.send_customer_email(
        recipient_email=customer_email or f"{customer_id.lower()}@example.com",
        ticket_id=ticket_id,
        subject=f"Orange Support - Ticket #{ticket_id} Resolution",
        customer_name=customer_name or customer_id,
        reply_content=response.reply_text,
        actions=response.suggested_actions
    )

    # 3. If escalated, trigger supervisor alert
    if is_escalated:
        email_service.send_escalation_alert(
            ticket_id=ticket_id,
            customer_id=customer_id,
            reason=escalation_reason or "Critical priority flag",
            customer_message=message
        )

    # Map customer emotion & satisfaction
    emotion = "neutral"
    if sentiment_risk.primary_emotion in ["satisfied", "delighted"] or classification.sentiment == "happy":
        emotion = "satisfied"
    elif sentiment_risk.primary_emotion == "angry" or classification.sentiment == "angry":
        emotion = "angry"
    elif sentiment_risk.primary_emotion == "frustrated" or classification.sentiment == "frustrated":
        emotion = "frustrated"
    elif sentiment_risk.primary_emotion == "anxious":
        emotion = "anxious"
    else:
        emotion = "neutral"

    # Build full session transcript
    transcript = []
    if conversation_history:
        for turn in conversation_history:
            role = turn.get("role") or turn.get("sender") or "user"
            content = turn.get("content") or turn.get("text") or ""
            transcript.append({
                "role": "user" if role in ["user", "customer"] else "assistant",
                "content": content,
                "timestamp": turn.get("timestamp") or datetime.utcnow().isoformat()
            })
    # Add current turn
    transcript.append({
        "role": "user",
        "content": message,
        "timestamp": datetime.utcnow().isoformat()
    })
    transcript.append({
        "role": "assistant",
        "content": response.reply_text,
        "timestamp": datetime.utcnow().isoformat()
    })
    session_transcript_json = json.dumps(transcript, ensure_ascii=False)

    # 4. Save ticket to SQLite Database
    ticket_dict = {
        "id": ticket_id,
        "customer_id": customer_id,
        "customer_name": customer_name or "احمد اسامه",
        "customer_email": customer_email,
        "customer_phone": customer_phone or "01288997766",
        "customer_plan": customer_plan or "Home DSL 400 GB (100 Mbps)",
        "region": region or "Giza",
        "message": message,
        "category": classification.category,
        "priority": classification.priority,
        "sentiment": classification.sentiment,
        "customer_emotion": emotion,
        "satisfaction_score": sentiment_risk.sentiment_score,
        "status": "escalated" if is_escalated else "resolved",
        "review_status": "unopened",
        "reviewed_at": None,
        "reviewer_notes": "",
        "reply": response.reply_text,
        "session_transcript": session_transcript_json,
        "escalated": is_escalated,
        "escalation_reason": escalation_reason,
        "qa_passed": qa_passed,
        "qa_retries": qa_retries,
        "latency_ms": latency_ms,
        "created_at": datetime.utcnow().isoformat(),
        "resolved_at": datetime.utcnow().isoformat()
    }
    save_ticket(ticket_dict)

    # 5. Sync ticket to Google Sheets or CSV Fallback
    sheets_synced = sheets_service.sync_ticket(ticket_dict)

    return ActionOutput(
        ticket_id=ticket_id,
        email_sent=bool(email_result.get("sent", False)),
        email_recipient=customer_email or f"{customer_id.lower()}@example.com",
        email_outbox_path=email_result.get("outbox_path"),
        escalated=is_escalated,
        escalation_reason=escalation_reason,
        sheets_synced=sheets_synced,
        timestamp=datetime.utcnow().isoformat()
    )
