import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional

from app.config import settings

DB_PATH = Path(settings.DATA_DIR) / "orange_support.db"

def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Tickets Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        customer_name TEXT DEFAULT 'احمد اسامه',
        customer_email TEXT,
        customer_phone TEXT DEFAULT '01288997766',
        customer_plan TEXT DEFAULT 'Home DSL 400 GB (100 Mbps)',
        region TEXT DEFAULT 'Giza',
        message TEXT NOT NULL,
        category TEXT,
        priority TEXT,
        sentiment TEXT,
        customer_emotion TEXT DEFAULT 'neutral',
        satisfaction_score REAL DEFAULT 0.0,
        status TEXT DEFAULT 'open',
        review_status TEXT DEFAULT 'unopened',
        reviewed_at TEXT,
        reviewer_notes TEXT,
        reply TEXT,
        session_transcript TEXT,
        escalated INTEGER DEFAULT 0,
        escalation_reason TEXT,
        qa_passed INTEGER DEFAULT 1,
        qa_retries INTEGER DEFAULT 0,
        latency_ms REAL DEFAULT 0,
        created_at TEXT NOT NULL,
        resolved_at TEXT
    )
    """)

    # Dynamic migration for existing SQLite database
    cursor.execute("PRAGMA table_info(tickets)")
    existing_cols = [r["name"] for r in cursor.fetchall()]
    col_defs = [
        ("customer_name", "TEXT DEFAULT 'احمد اسامه'"),
        ("customer_plan", "TEXT DEFAULT 'Home DSL 400 GB (100 Mbps)'"),
        ("customer_emotion", "TEXT DEFAULT 'neutral'"),
        ("satisfaction_score", "REAL DEFAULT 0.0"),
        ("review_status", "TEXT DEFAULT 'unopened'"),
        ("reviewed_at", "TEXT"),
        ("reviewer_notes", "TEXT"),
        ("session_transcript", "TEXT")
    ]
    for col_name, col_type in col_defs:
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE tickets ADD COLUMN {col_name} {col_type}")

    # Agent Step Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS agent_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id TEXT NOT NULL,
        step_name TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        status TEXT NOT NULL,
        duration_ms REAL DEFAULT 0,
        tokens_used INTEGER DEFAULT 0,
        output_json TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (ticket_id) REFERENCES tickets (id)
    )
    """)

    # Evaluation Runs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS eval_runs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        total_tests INTEGER,
        classification_accuracy REAL,
        escalation_accuracy REAL,
        qa_pass_rate REAL,
        avg_latency_ms REAL,
        avg_retries REAL,
        failure_rate REAL,
        results_json TEXT
    )
    """)

    conn.commit()
    conn.close()

def save_ticket(ticket_data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if ticket already exists (for multi-turn session updates)
    ticket_id = ticket_data.get("id")
    existing = None
    if ticket_id:
        cursor.execute("SELECT created_at, review_status, reviewed_at, reviewer_notes FROM tickets WHERE id = ?", (ticket_id,))
        existing = cursor.fetchone()

    created_at = existing["created_at"] if existing else ticket_data.get("created_at", datetime.utcnow().isoformat())
    review_status = existing["review_status"] if existing and existing["review_status"] else ticket_data.get("review_status", "unopened")
    reviewed_at = existing["reviewed_at"] if existing and existing["reviewed_at"] else ticket_data.get("reviewed_at")
    reviewer_notes = existing["reviewer_notes"] if existing and existing["reviewer_notes"] else ticket_data.get("reviewer_notes", "")

    cursor.execute("""
    INSERT OR REPLACE INTO tickets (
        id, customer_id, customer_name, customer_email, customer_phone, customer_plan, region,
        message, category, priority, sentiment, customer_emotion, satisfaction_score,
        status, review_status, reviewed_at, reviewer_notes, reply, session_transcript,
        escalated, escalation_reason, qa_passed, qa_retries,
        latency_ms, created_at, resolved_at
    ) VALUES (
        :id, :customer_id, :customer_name, :customer_email, :customer_phone, :customer_plan, :region,
        :message, :category, :priority, :sentiment, :customer_emotion, :satisfaction_score,
        :status, :review_status, :reviewed_at, :reviewer_notes, :reply, :session_transcript,
        :escalated, :escalation_reason, :qa_passed, :qa_retries,
        :latency_ms, :created_at, :resolved_at
    )
    """, {
        "id": ticket_id,
        "customer_id": ticket_data.get("customer_id", "CUST-1001"),
        "customer_name": ticket_data.get("customer_name", "احمد اسامه"),
        "customer_email": ticket_data.get("customer_email", ""),
        "customer_phone": ticket_data.get("customer_phone", "01288997766"),
        "customer_plan": ticket_data.get("customer_plan", "Home DSL 400 GB (100 Mbps)"),
        "region": ticket_data.get("region", "Giza"),
        "message": ticket_data.get("message", ""),
        "category": ticket_data.get("category", "other"),
        "priority": ticket_data.get("priority", "medium"),
        "sentiment": ticket_data.get("sentiment", "neutral"),
        "customer_emotion": ticket_data.get("customer_emotion", "neutral"),
        "satisfaction_score": ticket_data.get("satisfaction_score", 0.0),
        "status": ticket_data.get("status", "open"),
        "review_status": review_status,
        "reviewed_at": reviewed_at,
        "reviewer_notes": reviewer_notes,
        "reply": ticket_data.get("reply", ""),
        "session_transcript": ticket_data.get("session_transcript", ""),
        "escalated": 1 if ticket_data.get("escalated") else 0,
        "escalation_reason": ticket_data.get("escalation_reason", ""),
        "qa_passed": 1 if ticket_data.get("qa_passed", True) else 0,
        "qa_retries": ticket_data.get("qa_retries", 0),
        "latency_ms": ticket_data.get("latency_ms", 0.0),
        "created_at": created_at,
        "resolved_at": ticket_data.get("resolved_at") or datetime.utcnow().isoformat()
    })
    conn.commit()
    conn.close()

def log_agent_step(ticket_id: str, step_name: str, agent_name: str, status: str, duration_ms: float = 0.0, tokens: int = 0, output_data: Any = None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO agent_logs (ticket_id, step_name, agent_name, status, duration_ms, tokens_used, output_json, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ticket_id, step_name, agent_name, status, duration_ms, tokens,
        json.dumps(output_data, default=str) if output_data else None,
        datetime.utcnow().isoformat()
    ))
    conn.commit()
    conn.close()

def get_all_tickets(limit: int = 100, search: str = "", category: str = "", status: str = "", review_status: str = "") -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM tickets WHERE 1=1"
    params = []
    
    if search:
        query += " AND (message LIKE ? OR id LIKE ? OR customer_id LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)"
        like_val = f"%{search}%"
        params.extend([like_val, like_val, like_val, like_val, like_val])
    if category and category != "all":
        query += " AND category = ?"
        params.append(category)
    if status and status != "all":
        query += " AND status = ?"
        params.append(status)
    if review_status and review_status != "all":
        query += " AND review_status = ?"
        params.append(review_status)
        
    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    tickets = [dict(row) for row in rows]
    conn.close()
    return tickets

def get_ticket_by_id(ticket_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    ticket = dict(row)
    
    # get logs
    cursor.execute("SELECT * FROM agent_logs WHERE ticket_id = ? ORDER BY id ASC", (ticket_id,))
    ticket["logs"] = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return ticket

def update_ticket_review(ticket_id: str, review_status: str, reviewer_notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.utcnow().isoformat()
    if reviewer_notes is not None:
        cursor.execute("""
        UPDATE tickets 
        SET review_status = ?, reviewed_at = ?, reviewer_notes = ?
        WHERE id = ?
        """, (review_status, now_iso, reviewer_notes, ticket_id))
    else:
        cursor.execute("""
        UPDATE tickets 
        SET review_status = ?, reviewed_at = ?
        WHERE id = ?
        """, (review_status, now_iso, ticket_id))
    conn.commit()
    conn.close()
    return get_ticket_by_id(ticket_id)

def get_kpis() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as total FROM tickets")
    total = cursor.fetchone()["total"] or 0
    
    cursor.execute("SELECT AVG(latency_ms) as avg_latency FROM tickets WHERE latency_ms > 0")
    avg_latency = cursor.fetchone()["avg_latency"] or 0.0
    
    cursor.execute("SELECT COUNT(*) as escalated_count FROM tickets WHERE escalated = 1")
    escalated = cursor.fetchone()["escalated_count"] or 0
    escalation_rate = round((escalated / total * 100) if total > 0 else 0, 1)
    
    cursor.execute("SELECT COUNT(*) as qa_pass FROM tickets WHERE qa_passed = 1")
    qa_passed = cursor.fetchone()["qa_pass"] or 0
    qa_pass_rate = round((qa_passed / total * 100) if total > 0 else 100.0, 1)

    # Review statuses counts
    cursor.execute("SELECT COUNT(*) as c FROM tickets WHERE review_status = 'unopened' OR review_status IS NULL")
    unopened_count = cursor.fetchone()["c"] or 0
    cursor.execute("SELECT COUNT(*) as c FROM tickets WHERE review_status = 'reviewed_and_handled'")
    reviewed_count = cursor.fetchone()["c"] or 0
    cursor.execute("SELECT COUNT(*) as c FROM tickets WHERE review_status = 'needs_followup'")
    needs_followup_count = cursor.fetchone()["c"] or 0
    
    # Category counts
    cursor.execute("SELECT category, COUNT(*) as count FROM tickets GROUP BY category")
    by_category = [{"category": r["category"] or "other", "count": r["count"]} for r in cursor.fetchall()]
    
    # Sentiment counts
    cursor.execute("SELECT sentiment, COUNT(*) as count FROM tickets GROUP BY sentiment")
    by_sentiment = [{"sentiment": r["sentiment"] or "neutral", "count": r["count"]} for r in cursor.fetchall()]

    # Emotion counts
    cursor.execute("SELECT customer_emotion, COUNT(*) as count FROM tickets GROUP BY customer_emotion")
    by_emotion = [{"emotion": r["customer_emotion"] or "neutral", "count": r["count"]} for r in cursor.fetchall()]
    
    # Tickets over past 7 days (or recent)
    cursor.execute("""
    SELECT SUBSTR(created_at, 1, 10) as day, COUNT(*) as count, SUM(escalated) as escalated
    FROM tickets
    GROUP BY SUBSTR(created_at, 1, 10)
    ORDER BY day DESC LIMIT 7
    """)
    over_time = [{"day": r["day"], "count": r["count"], "escalated": r["escalated"]} for r in cursor.fetchall()]
    over_time.reverse()
    
    conn.close()
    return {
        "total_tickets": total,
        "avg_response_time_ms": round(avg_latency, 1),
        "escalation_rate": escalation_rate,
        "qa_pass_rate": qa_pass_rate,
        "unopened_count": unopened_count,
        "reviewed_count": reviewed_count,
        "needs_followup_count": needs_followup_count,
        "by_category": by_category,
        "by_sentiment": by_sentiment,
        "by_emotion": by_emotion,
        "over_time": over_time
    }

