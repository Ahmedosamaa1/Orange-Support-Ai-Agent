from typing import TypedDict, Optional, List, Dict, Any

class AgentState(TypedDict):
    ticket_id: str
    customer_id: str
    customer_name: Optional[str]
    customer_email: str
    customer_phone: str
    customer_plan: Optional[str]
    region: str
    message: str
    conversation_history: Optional[List[Dict[str, Any]]]
    
    # Agent structured outputs
    classification: Optional[Dict[str, Any]]
    sentiment_risk: Optional[Dict[str, Any]]
    retrieval: Optional[Dict[str, Any]]
    response: Optional[Dict[str, Any]]
    qa: Optional[Dict[str, Any]]
    actions: Optional[Dict[str, Any]]
    
    # Control flow & diagnostics
    qa_retries: int
    qa_feedback: Optional[str]
    timeline: List[Dict[str, Any]]
    start_time: float
    total_duration_ms: float
    error: Optional[str]
