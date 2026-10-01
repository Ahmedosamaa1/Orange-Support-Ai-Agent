from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime

# ==========================================
# Agent Structured Output Schemas
# ==========================================

class ClassificationOutput(BaseModel):
    category: Literal["technical", "billing", "plan inquiry", "service request", "other"] = Field(
        ..., description="Category of the telecom customer issue"
    )
    priority: Literal["low", "medium", "high", "critical"] = Field(
        ..., description="Urgency and impact priority"
    )
    sentiment: Literal["happy", "neutral", "frustrated", "angry"] = Field(
        ..., description="Detected customer sentiment"
    )
    language: Literal["ar", "en"] = Field(
        ..., description="Language of customer input"
    )
    summary: str = Field(
        ..., description="One-line summary of the core issue"
    )

class SentimentRiskOutput(BaseModel):
    sentiment_score: float = Field(
        ..., ge=-1.0, le=1.0, description="Sentiment score from -1.0 to +1.0"
    )
    primary_emotion: Literal["angry", "frustrated", "anxious", "neutral", "satisfied", "delighted"]
    churn_risk: Literal["low", "medium", "high", "critical"]
    escalation_recommended: bool
    escalation_reason: str
    recommended_tone: Literal["empathetic", "urgent", "informative", "apologetic", "reassuring"]

class Citation(BaseModel):
    source_type: Literal["pdf_kb", "google_sheets_csv", "network_api"]
    source_title: str
    snippet: str
    confidence: float = 0.95

class CustomerAccount(BaseModel):
    customer_id: str
    name: str
    phone: str
    plan_name: str
    balance_egp: float
    current_quota_gb: float
    remaining_quota_gb: float
    bill_due_date: str
    status: str
    recent_charges: List[Dict[str, Any]] = []

class NetworkStatus(BaseModel):
    region: str
    status: Literal["operational", "degraded", "outage"]
    affected_services: List[str] = []
    estimated_fix_time: Optional[str] = None
    details: str

class RetrievalOutput(BaseModel):
    citations: List[Citation] = []
    customer_account: Optional[CustomerAccount] = None
    network_status: Optional[NetworkStatus] = None
    faq_matches: List[str] = []
    rag_context: str = ""

class SummarizerOutput(BaseModel):
    context_summary: str
    key_findings: List[str] = []
    identified_resolution: str

class ResponseOutput(BaseModel):
    reply_text: str
    suggested_actions: List[str] = []
    estimated_resolution_time: str = "Within 2 hours"

class QAChecks(BaseModel):
    factual_accuracy: bool = True
    no_false_promises: bool = True
    tone_and_brand: bool = True
    language_match: bool = True

class QAOutput(BaseModel):
    passed: bool
    score: float = Field(..., ge=0.0, le=1.0)
    checks: QAChecks
    feedback: str
    recommended_fix: Optional[str] = None

class ActionOutput(BaseModel):
    ticket_id: str
    email_sent: bool = False
    email_recipient: Optional[str] = None
    email_outbox_path: Optional[str] = None
    escalated: bool = False
    escalation_reason: Optional[str] = None
    sheets_synced: bool = False
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# ==========================================
# API Request & Response Schemas
# ==========================================

class SupportRequest(BaseModel):
    message: str
    ticket_id: Optional[str] = None
    customer_id: Optional[str] = "CUST-1001"
    customer_name: Optional[str] = "احمد اسامه"
    customer_email: Optional[str] = "ahmed.customer@example.com"
    customer_phone: Optional[str] = "01234567890"
    customer_plan: Optional[str] = "Home DSL 140 GB"
    region: Optional[str] = "Cairo"
    conversation_history: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class AgentStepEvent(BaseModel):
    step_name: str
    agent_name: str
    status: Literal["running", "completed", "retrying", "failed"]
    duration_ms: float = 0.0
    tokens_used: int = 0
    data: Optional[Dict[str, Any]] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class FinalPipelineResponse(BaseModel):
    ticket_id: str
    success: bool
    customer_message: str
    classification: Optional[ClassificationOutput] = None
    sentiment_risk: Optional[SentimentRiskOutput] = None
    retrieval: Optional[RetrievalOutput] = None
    response: Optional[ResponseOutput] = None
    qa: Optional[QAOutput] = None
    actions: Optional[ActionOutput] = None
    retries_count: int = 0
    total_duration_ms: float = 0.0
    timeline: List[AgentStepEvent] = []

class TicketReviewRequest(BaseModel):
    review_status: Literal["unopened", "reviewed_and_handled", "needs_followup"]
    reviewer_notes: Optional[str] = None

class TicketSummary(BaseModel):
    id: str
    customer_id: str
    customer_name: Optional[str] = "احمد اسامه"
    customer_phone: Optional[str] = "01288997766"
    customer_plan: Optional[str] = "Home DSL 400 GB"
    region: Optional[str] = "Giza"
    message: str
    category: str
    priority: str
    sentiment: str
    customer_emotion: Optional[str] = "neutral"
    satisfaction_score: Optional[float] = 0.0
    status: str
    review_status: Optional[str] = "unopened"
    reviewed_at: Optional[str] = None
    reviewer_notes: Optional[str] = None
    escalated: bool
    reply: Optional[str] = ""
    session_transcript: Optional[str] = None
    latency_ms: Optional[float] = 0.0
    created_at: str

