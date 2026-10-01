import json
import asyncio
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel

from app.config import settings
from app.database import (
    init_db,
    get_all_tickets,
    get_ticket_by_id,
    get_kpis,
    save_ticket,
    update_ticket_review
)
from app.schemas import (
    SupportRequest,
    FinalPipelineResponse,
    TicketSummary,
    TicketReviewRequest,
    NetworkStatus
)
from app.graph.workflow import support_graph, run_pipeline_streaming
from app.services.rag_service import rag_service
from app.services.sheets_service import sheets_service
from app.services.network_service import network_service
from app.services.report_service import report_service, REPORTS_DIR
from app.seed import seed_all

app = FastAPI(
    title="Orange Smart Support Agent API",
    description="Multi-Agent AI Customer Support System for Orange Telecom",
    version="1.0.0"
)

# Enable CORS for React Frontend (Vite default :5173 and any local dev origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    rag_service.index_documents()
    sheets_service.seed_default_data()

# ==========================================
# Core Multi-Agent Endpoints
# ==========================================

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "mock_llm": settings.MOCK_LLM,
        "gemini_model": settings.GEMINI_MODEL,
        "indexed_chunks": len(rag_service.chunks),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/chat", response_model=Dict[str, Any])
async def process_chat(req: SupportRequest):
    """Run full LangGraph pipeline synchronously via support_graph.ainvoke."""
    try:
        ticket_id = req.ticket_id or f"ORG-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        initial_state = {
            "ticket_id": ticket_id,
            "customer_id": req.customer_id or "CUST-1001",
            "customer_name": req.customer_name or "احمد اسامه",
            "customer_email": req.customer_email or "customer@example.com",
            "customer_phone": req.customer_phone or "01234567890",
            "customer_plan": req.customer_plan or "Home DSL 140 GB",
            "region": req.region or "Cairo",
            "message": req.message,
            "conversation_history": req.conversation_history or [],
            "classification": None,
            "sentiment_risk": None,
            "retrieval": None,
            "response": None,
            "qa": None,
            "actions": None,
            "qa_retries": 0,
            "qa_feedback": None,
            "timeline": [],
            "start_time": time.time(),
            "total_duration_ms": 0.0,
            "error": None
        }
        final_state = await support_graph.ainvoke(initial_state)
        return {
            "event": "pipeline_complete",
            "ticket_id": ticket_id,
            "final_state": final_state,
            "response": final_state.get("response")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/stream")
async def process_chat_stream(req: SupportRequest):
    """Server-Sent Events (SSE) streaming endpoint for live agent progression in the UI."""
    async def event_generator():
        try:
            async for event in run_pipeline_streaming(
                message=req.message,
                ticket_id=req.ticket_id,
                customer_id=req.customer_id or "CUST-1001",
                customer_name=req.customer_name or "احمد اسامه",
                customer_email=req.customer_email or "customer@example.com",
                customer_phone=req.customer_phone or "01234567890",
                customer_plan=req.customer_plan or "Home DSL 140 GB",
                region=req.region or "Cairo",
                conversation_history=req.conversation_history or []
            ):
                yield f"data: {json.dumps(event, default=str)}\n\n"
                await asyncio.sleep(0.05)
        except Exception as e:
            err_payload = {"event": "error", "error": str(e)}
            yield f"data: {json.dumps(err_payload)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

# ==========================================
# External Network API Mock
# ==========================================

@app.get("/api/network-status", response_model=NetworkStatus)
def get_network_status(region: str = Query("Cairo", description="Region name")):
    """Mock external REST API returning network health and outage status."""
    return network_service.check_status(region)

# ==========================================
# Tickets & Dashboard Endpoints
# ==========================================

@app.get("/api/tickets")
def list_tickets(
    limit: int = 50,
    search: str = "",
    category: str = "",
    status: str = "",
    review_status: str = ""
):
    tickets = get_all_tickets(limit=limit, search=search, category=category, status=status, review_status=review_status)
    return {"tickets": tickets, "count": len(tickets)}

@app.get("/api/tickets/{ticket_id}")
def get_ticket_details(ticket_id: str):
    ticket = get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@app.patch("/api/tickets/{ticket_id}/review")
def review_ticket(ticket_id: str, req: TicketReviewRequest):
    ticket = update_ticket_review(ticket_id, req.review_status, req.reviewer_notes)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"status": "success", "ticket": ticket}

@app.get("/api/dashboard/kpis")
def get_dashboard_kpis():
    return get_kpis()

# ==========================================
# Knowledge Base & Documents
# ==========================================

@app.get("/api/knowledge-base")
def get_kb_info():
    pdf_files = [f.name for f in settings.PDFS_DIR.glob("*.pdf")]
    return {
        "pdfs": pdf_files,
        "total_chunks": len(rag_service.chunks),
        "sheets": ["customers.csv", "faqs.csv"],
        "outbox_emails_count": len(list(settings.OUTBOX_DIR.glob("*.html")))
    }

@app.post("/api/knowledge-base/reindex")
def reindex_knowledge_base():
    rag_service.index_documents()
    sheets_service.seed_default_data()
    return {"status": "success", "chunks_indexed": len(rag_service.chunks)}

# ==========================================
# Automated Reports
# ==========================================

@app.post("/api/reports/generate")
def generate_report():
    report_info = report_service.generate_daily_report()
    return {
        "status": "success",
        "pdf_download_url": f"/api/reports/download/{report_info['pdf_filename']}",
        "html_filename": report_info["html_filename"],
        "generated_at": report_info["generated_at"]
    }

@app.get("/api/reports/download/{filename}")
def download_report(filename: str):
    file_path = REPORTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Report file not found")
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/pdf"
    )

# ==========================================
# Evaluation Suite Runner Trigger
# ==========================================

@app.post("/api/evaluation/run")
async def run_evaluation_suite():
    """Execute the 15-test evaluation benchmark and return metrics."""
    from tests.eval_runner import evaluate_dataset
    results = await evaluate_dataset()
    return results
