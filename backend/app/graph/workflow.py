import time
import uuid
import asyncio
from datetime import datetime
from typing import Dict, Any, AsyncGenerator, Optional, List

from langgraph.graph import StateGraph, END

from app.graph.state import AgentState
from app.schemas import (
    ClassificationOutput,
    SentimentRiskOutput,
    RetrievalOutput,
    ResponseOutput,
    QAOutput,
    ActionOutput
)
from app.agents.classifier import run_classifier_agent
from app.agents.sentiment_risk import run_sentiment_risk_agent
from app.agents.retrieval import run_retrieval_agent
from app.agents.response import run_response_agent
from app.agents.qa import run_qa_agent
from app.agents.action import run_action_agent
from app.database import log_agent_step

# ==========================================
# Node Definitions
# ==========================================

def sanitize_user_input(text: str) -> str:
    """Sanitize user input against prompt injection, malicious delimiters, and script tags."""
    if not text:
        return ""
    import re
    # 1. Strip harmful HTML/Script tags
    cleaned = re.sub(r'<[^>]*>', '', text)
    # 2. Neutralize classic Prompt Injection jailbreaks and instruction overrides
    injection_patterns = [
        r'(?i)\b(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above)\s+instructions\b',
        r'(?i)\b(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above)\s+rules\b',
        r'(?i)\byou\s+are\s+now\s+(a|an|in)\b',
        r'(?i)\bdo\s+anything\s+now\b',
        r'(?i)\bact\s+as\s+(an?\s+)?(unrestricted|evil|dan|developer\s+mode)\b',
        r'(?i)\bjailbreak\b',
        r'(?mi)^\s*\[\s*(system|instruction|developer|admin)\s*\]',
        r'(?mi)^\s*<\s*(system|instruction|developer|admin)\s*>',
        r'(?mi)^\s*(system|assistant|developer|admin)\s*:\s*',
        r'(?mi)^\s*user\s*:\s*'
    ]
    for pattern in injection_patterns:
        cleaned = re.sub(pattern, '[FILTERED_INPUT]', cleaned)
    # 3. Restrict max characters to prevent denial-of-service
    if len(cleaned) > 2000:
        cleaned = cleaned[:2000]
    return cleaned.strip()

def estimate_tokens(text: str) -> int:
    """Calculate realistic dynamic tokens based on character count and word density."""
    if not text:
        return 12
    words = len(text.split())
    chars = len(text)
    return max(15, int(words * 1.3 + chars / 4))

async def intake_node(state: AgentState) -> Dict[str, Any]:
    t0 = time.time()
    sanitized_msg = sanitize_user_input(state["message"])
    duration = round((time.time() - t0) * 1000, 1)
    tokens = estimate_tokens(sanitized_msg)
    
    event = {
        "step_name": "intake",
        "agent_name": "Intake Orchestrator",
        "status": "completed",
        "duration_ms": max(0.5, duration),
        "tokens_used": tokens,
        "data": {
            "ticket_id": state["ticket_id"],
            "customer_id": state["customer_id"],
            "sanitized": sanitized_msg != state["message"]
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    log_agent_step(state["ticket_id"], "intake", "Intake Orchestrator", "completed", duration, tokens, event["data"])
    return {
        "message": sanitized_msg,
        "timeline": [event]
    }

def normalize_arabic_intent(text: str) -> str:
    """Pre-process keyboard slips, typos, and Egyptian slang (e.g. باقع -> باقة, ابجريت -> ترقية باقة)."""
    import re
    t = text
    t = re.sub(r'\b(باقع|الباوقع|باقا|الباكا)\b', 'باقة', t)
    t = re.sub(r'\b(الباقع|البااقه)\b', 'الباقة', t)
    t = re.sub(r'\b(ابجريت|أبجريت|ابجريد|أبجريد)\b', 'ترقية باقة ابجريد', t)
    t = re.sub(r'\bروتر\b', 'راوتر', t)
    t = re.sub(r'\b(كنسل|الغا|كنسله|كنسلها)\b', 'إلغاء', t)
    return t

async def classifier_node(state: AgentState) -> Dict[str, Any]:
    t0 = time.time()
    normalized_msg = normalize_arabic_intent(state["message"])
    result = await run_classifier_agent(normalized_msg)
    duration = round((time.time() - t0) * 1000, 1)
    tokens = estimate_tokens(normalized_msg) + 50
    
    event = {
        "step_name": "classifier",
        "agent_name": "Classifier Agent",
        "status": "completed",
        "duration_ms": duration,
        "tokens_used": tokens,
        "data": result.model_dump(),
        "timestamp": datetime.utcnow().isoformat()
    }
    log_agent_step(state["ticket_id"], "classifier", "Classifier Agent", "completed", duration, tokens, result.model_dump())
    
    return {
        "classification": result.model_dump(),
        "timeline": state["timeline"] + [event]
    }

async def parallel_retrieval_node(state: AgentState) -> Dict[str, Any]:
    t0 = time.time()
    normalized_msg = normalize_arabic_intent(state["message"])
    result = await run_retrieval_agent(
        message=normalized_msg,
        customer_id=state["customer_id"],
        region=state["region"]
    )
    duration = round((time.time() - t0) * 1000, 1)
    tokens = estimate_tokens(result.rag_context) + 45
    
    event = {
        "step_name": "retrieval",
        "agent_name": "Retrieval Agent (RAG + Sheets + API)",
        "status": "completed",
        "duration_ms": duration,
        "tokens_used": tokens,
        "data": {
            "citations_count": len(result.citations),
            "citations": [c.model_dump() for c in result.citations],
            "customer_account": result.customer_account.model_dump() if result.customer_account else None,
            "network_status": result.network_status.model_dump() if result.network_status else None
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    log_agent_step(state["ticket_id"], "retrieval", "Retrieval Agent", "completed", duration, tokens, event["data"])
    
    return {
        "retrieval": result.model_dump(),
        "timeline": state["timeline"] + [event]
    }

async def parallel_sentiment_node(state: AgentState) -> Dict[str, Any]:
    t0 = time.time()
    category = state.get("classification", {}).get("category", "technical")
    result = await run_sentiment_risk_agent(state["message"], category=category)
    duration = round((time.time() - t0) * 1000, 1)
    tokens = estimate_tokens(state["message"]) + 40
    
    event = {
        "step_name": "sentiment_risk",
        "agent_name": "Sentiment & Risk Agent",
        "status": "completed",
        "duration_ms": duration,
        "tokens_used": tokens,
        "data": result.model_dump(),
        "timestamp": datetime.utcnow().isoformat()
    }
    log_agent_step(state["ticket_id"], "sentiment_risk", "Sentiment & Risk Agent", "completed", duration, tokens, result.model_dump())
    
    return {
        "sentiment_risk": result.model_dump(),
        "timeline": state["timeline"] + [event]
    }

async def parallel_branch_node(state: AgentState) -> Dict[str, Any]:
    """Execute Retrieval Agent and Sentiment/Risk Agent concurrently in parallel."""
    retrieval_task = parallel_retrieval_node(state)
    sentiment_task = parallel_sentiment_node(state)
    
    ret_res, sent_res = await asyncio.gather(retrieval_task, sentiment_task)
    
    combined_timeline = list(state["timeline"])
    for ev in ret_res["timeline"]:
        if ev not in combined_timeline:
            combined_timeline.append(ev)
    for ev in sent_res["timeline"]:
        if ev not in combined_timeline:
            combined_timeline.append(ev)
            
    return {
        "retrieval": ret_res["retrieval"],
        "sentiment_risk": sent_res["sentiment_risk"],
        "timeline": combined_timeline
    }

async def response_node(state: AgentState) -> Dict[str, Any]:
    t0 = time.time()
    cls_obj = ClassificationOutput(**state["classification"])
    sent_obj = SentimentRiskOutput(**state["sentiment_risk"])
    ret_obj = RetrievalOutput(**state["retrieval"])
    
    result = await run_response_agent(
        message=state["message"],
        classification=cls_obj,
        sentiment_risk=sent_obj,
        retrieval=ret_obj,
        customer_id=state["customer_id"],
        customer_name=state.get("customer_name"),
        customer_phone=state.get("customer_phone"),
        customer_plan=state.get("customer_plan"),
        region=state.get("region", "Cairo"),
        conversation_history=state.get("conversation_history"),
        qa_feedback=state.get("qa_feedback")
    )
    duration = round((time.time() - t0) * 1000, 1)
    
    tokens = estimate_tokens(result.reply_text) + 80
    event = {
        "step_name": "response",
        "agent_name": "Response Agent",
        "status": "completed",
        "duration_ms": duration,
        "tokens_used": tokens,
        "data": result.model_dump(),
        "timestamp": datetime.utcnow().isoformat()
    }
    log_agent_step(state["ticket_id"], "response", "Response Agent", "completed", duration, tokens, result.model_dump())
    
    return {
        "response": result.model_dump(),
        "timeline": state["timeline"] + [event]
    }

async def qa_node(state: AgentState) -> Dict[str, Any]:
    t0 = time.time()
    resp_obj = ResponseOutput(**state["response"])
    cls_obj = ClassificationOutput(**state["classification"])
    ret_obj = RetrievalOutput(**state["retrieval"])
    
    result = await run_qa_agent(
        proposed_response=resp_obj,
        customer_message=state["message"],
        classification=cls_obj,
        retrieval=ret_obj
    )
    duration = round((time.time() - t0) * 1000, 1)
    tokens = estimate_tokens(resp_obj.reply_text) + 40
    
    event = {
        "step_name": "qa",
        "agent_name": "QA Agent",
        "status": "completed" if result.passed else "retrying",
        "duration_ms": duration,
        "tokens_used": tokens,
        "data": result.model_dump(),
        "timestamp": datetime.utcnow().isoformat()
    }
    log_agent_step(state["ticket_id"], "qa", "QA Agent", "completed" if result.passed else "failed", duration, tokens, result.model_dump())
    
    # Check retry loop logic
    qa_retries = state.get("qa_retries", 0)
    new_feedback = None
    if not result.passed:
        qa_retries += 1
        new_feedback = result.recommended_fix or result.feedback
        
    return {
        "qa": result.model_dump(),
        "qa_retries": qa_retries,
        "qa_feedback": new_feedback,
        "timeline": state["timeline"] + [event]
    }

def route_qa(state: AgentState) -> str:
    """Conditional routing based on QA verification."""
    qa_data = state.get("qa", {})
    passed = qa_data.get("passed", True)
    retries = state.get("qa_retries", 0)
    
    if not passed and retries < 2:
        return "response"  # Loop back to response agent with feedback
    return "action"       # Proceed to Action Agent

async def action_node(state: AgentState) -> Dict[str, Any]:
    t0 = time.time()
    cls_obj = ClassificationOutput(**state["classification"])
    sent_obj = SentimentRiskOutput(**state["sentiment_risk"])
    resp_obj = ResponseOutput(**state["response"])
    qa_obj = QAOutput(**state["qa"])
    
    total_duration = round((time.time() - state["start_time"]) * 1000, 1)
    
    result = await run_action_agent(
        ticket_id=state["ticket_id"],
        customer_id=state["customer_id"],
        customer_name=state.get("customer_name") or "احمد اسامه",
        customer_email=state["customer_email"],
        customer_phone=state["customer_phone"],
        customer_plan=state.get("customer_plan") or "Home DSL 400 GB (100 Mbps)",
        region=state["region"],
        message=state["message"],
        classification=cls_obj,
        sentiment_risk=sent_obj,
        response=resp_obj,
        conversation_history=state.get("conversation_history") or [],
        qa_passed=qa_obj.passed,
        qa_retries=state.get("qa_retries", 0),
        latency_ms=total_duration
    )
    duration = round((time.time() - t0) * 1000, 1)
    tokens = estimate_tokens(result.escalation_reason or "") + 25
    
    event = {
        "step_name": "action",
        "agent_name": "Action Agent",
        "status": "completed",
        "duration_ms": duration,
        "tokens_used": tokens,
        "data": result.model_dump(),
        "timestamp": datetime.utcnow().isoformat()
    }
    log_agent_step(state["ticket_id"], "action", "Action Agent", "completed", duration, tokens, result.model_dump())
    
    return {
        "actions": result.model_dump(),
        "total_duration_ms": total_duration,
        "timeline": state["timeline"] + [event]
    }

# ==========================================
# LangGraph Workflow Construction
# ==========================================

def create_support_graph():
    workflow = StateGraph(AgentState)
    
    # Add Nodes
    workflow.add_node("intake", intake_node)
    workflow.add_node("classifier", classifier_node)
    workflow.add_node("parallel_branch", parallel_branch_node)
    workflow.add_node("response", response_node)
    workflow.add_node("qa", qa_node)
    workflow.add_node("action", action_node)
    
    # Set Entry Point
    workflow.set_entry_point("intake")
    
    # Add Standard Edges
    workflow.add_edge("intake", "classifier")
    workflow.add_edge("classifier", "parallel_branch")
    workflow.add_edge("parallel_branch", "response")
    workflow.add_edge("response", "qa")
    
    # Add Conditional QA Feedback Loop
    workflow.add_conditional_edges(
        "qa",
        route_qa,
        {
            "response": "response",
            "action": "action"
        }
    )
    workflow.add_edge("action", END)
    
    return workflow.compile()

support_graph = create_support_graph()

# ==========================================
# Streaming Execution Generator (SSE)
# ==========================================

async def run_pipeline_streaming(
    message: str,
    ticket_id: Optional[str] = None,
    customer_id: str = "CUST-1001",
    customer_name: Optional[str] = "احمد اسامه",
    customer_email: str = "customer@example.com",
    customer_phone: str = "01234567890",
    customer_plan: Optional[str] = "Home DSL 140 GB",
    region: str = "Cairo",
    conversation_history: Optional[List[Dict[str, Any]]] = None
) -> AsyncGenerator[Dict[str, Any], None]:
    """Execute multi-agent graph yielding real-time SSE progress events."""
    if not ticket_id:
        ticket_id = f"ORG-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    start_time = time.time()
    
    state: AgentState = {
        "ticket_id": ticket_id,
        "customer_id": customer_id,
        "customer_name": customer_name,
        "customer_email": customer_email,
        "customer_phone": customer_phone,
        "customer_plan": customer_plan,
        "region": region,
        "message": message,
        "conversation_history": conversation_history or [],
        "classification": None,
        "sentiment_risk": None,
        "retrieval": None,
        "response": None,
        "qa": None,
        "actions": None,
        "qa_retries": 0,
        "qa_feedback": None,
        "timeline": [],
        "start_time": start_time,
        "total_duration_ms": 0.0,
        "error": None
    }

    # 1. Intake
    yield {"event": "step_start", "step": "intake", "agent": "Intake Orchestrator", "ticket_id": ticket_id}
    res = await intake_node(state)
    state.update(res)
    yield {"event": "step_complete", "step": "intake", "data": state["timeline"][-1]}

    # 2. Classifier
    yield {"event": "step_start", "step": "classifier", "agent": "Classifier Agent"}
    res = await classifier_node(state)
    state.update(res)
    yield {"event": "step_complete", "step": "classifier", "data": state["timeline"][-1]}

    # 3. Parallel Branch: Retrieval + Sentiment
    yield {"event": "step_start", "step": "retrieval_and_sentiment", "agent": "Parallel Branch (Retrieval & Risk)"}
    res = await parallel_branch_node(state)
    state.update(res)
    yield {"event": "step_complete", "step": "retrieval", "data": state["timeline"][-2]}
    yield {"event": "step_complete", "step": "sentiment_risk", "data": state["timeline"][-1]}

    # 4. Response & QA Loop
    max_retries = 2
    for attempt in range(max_retries + 1):
        yield {"event": "step_start", "step": "response", "agent": "Response Agent", "attempt": attempt + 1}
        res = await response_node(state)
        state.update(res)
        yield {"event": "step_complete", "step": "response", "data": state["timeline"][-1]}

        yield {"event": "step_start", "step": "qa", "agent": "QA Agent", "attempt": attempt + 1}
        res = await qa_node(state)
        state.update(res)
        yield {"event": "step_complete", "step": "qa", "data": state["timeline"][-1]}

        qa_passed = state["qa"].get("passed", True)
        if qa_passed or state["qa_retries"] >= max_retries:
            break
        yield {"event": "qa_retry_loop", "reason": state.get("qa_feedback")}

    # 5. Action Agent
    yield {"event": "step_start", "step": "action", "agent": "Action Agent"}
    res = await action_node(state)
    state.update(res)
    yield {"event": "step_complete", "step": "action", "data": state["timeline"][-1]}

    # Final Payload
    yield {
        "event": "pipeline_complete",
        "ticket_id": ticket_id,
        "final_state": state
    }
