import pytest
import asyncio
from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "backend"))

from app.database import init_db, get_connection, save_ticket, get_kpis
from app.services.rag_service import rag_service
from app.services.sheets_service import sheets_service
from app.services.network_service import network_service
from app.graph.workflow import run_pipeline_streaming

@pytest.fixture(autouse=True)
def setup_test_env():
    init_db()
    rag_service.index_documents()
    sheets_service.seed_default_data()

def test_database_init():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row["name"] for row in cursor.fetchall()]
    conn.close()
    assert "tickets" in tables
    assert "agent_logs" in tables

def test_rag_retrieval():
    citations = rag_service.search("Home DSL 140 GB")
    assert len(citations) > 0
    assert any("Home DSL" in c.snippet for c in citations)

def test_network_service():
    cairo_status = network_service.check_status("Cairo")
    assert cairo_status.region == "Cairo"
    assert cairo_status.status in ["operational", "degraded", "outage"]

def test_sheets_service():
    acc = sheets_service.get_customer_account("CUST-1001")
    assert acc is not None
    assert acc.customer_id == "CUST-1001"
    assert acc.balance_egp >= 0

@pytest.mark.asyncio
async def test_end_to_end_pipeline():
    message = "النت بطيء جدا من امبارح"
    events = []
    final_state = None
    
    async for event in run_pipeline_streaming(
        message=message,
        customer_id="CUST-1001",
        customer_email="test@example.com",
        region="Cairo"
    ):
        events.append(event)
        if event.get("event") == "pipeline_complete":
            final_state = event.get("final_state")
            
    assert final_state is not None
    assert final_state["classification"]["category"] == "technical"
    assert final_state["qa"]["passed"] is True
    assert final_state["actions"]["email_outbox_path"] is not None or final_state["actions"]["email_sent"] is True
    assert final_state["ticket_id"].startswith("ORG-")
