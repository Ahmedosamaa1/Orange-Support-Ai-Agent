# 🏗️ Orange Smart Support Agent - Architecture & System Design

> **Demo Project Note**: This project is built for educational demonstration purposes and is not affiliated with Orange Telecom.

---

## 1. High-Level System Architecture

The **Orange Smart Support Agent** is an enterprise-grade multi-agent AI system designed to automate customer support workflows in the telecommunications domain. It addresses complex, multi-step customer inquiries (in both Arabic and English) by coordinating six specialized AI agents orchestrated via **LangGraph**.

```mermaid
flowchart TD
    subgraph ClientLayer["🖥️ Frontend Client Layer"]
        UI["React + Vite + Tailwind CSS"]
        SSE["Server-Sent Events (SSE) Listener"]
    end

    subgraph APILayer["⚡ FastAPI Gateway"]
        Endpoint["/api/chat/stream"]
        RestAPI["REST API (Tickets, KPIs, Reports)"]
    end

    subgraph MultiAgentCore["🤖 LangGraph Multi-Agent Orchestration"]
        Intake["1. Intake Orchestrator"]
        Classifier["2. Classifier Agent"]
        
        subgraph ConcurrentBranch["⚡ Concurrent Parallel Execution"]
            Retrieval["3a. Retrieval Agent (RAG)"]
            SentimentRisk["3b. Sentiment & Risk Agent"]
        end

        ResponseAgent["4. Response Agent"]
        QAAgent{"5. QA Audit Agent\n(Audit Passed?)"}
        ActionAgent["6. Action Agent"]
    end

    subgraph KnowledgeData["📚 Multi-Source Intelligence"]
        PDF_RAG["PyMuPDF RAG (Plans & SLA PDFs)"]
        Sheets_CSV["Google Sheets / CSV Accounts & FAQs"]
        Network_API["Regional Network Health REST API"]
    end

    subgraph ActionSideEffects["🚀 Downstream Actions"]
        OutboxMail["Email Dispatch (RFC 822 .eml / HTML)"]
        DBStore["SQLite DB & Google Sheets Sync"]
        SupervisorAlert["Human Supervisor Escalation Alert"]
        DailyPDF["Daily Executive Summary PDF Report"]
    end

    UI -->|Customer Query| Endpoint
    Endpoint --> Intake
    Intake --> Classifier
    Classifier --> Retrieval
    Classifier --> SentimentRisk
    
    Retrieval <-->|Semantic Search| PDF_RAG
    Retrieval <-->|Account Balances| Sheets_CSV
    Retrieval <-->|Outage Query| Network_API
    
    Retrieval --> ResponseAgent
    SentimentRisk --> ResponseAgent
    
    ResponseAgent --> QAAgent
    QAAgent -->|❌ Failed QA (max 2 retries)| ResponseAgent
    QAAgent -->|✅ Approved| ActionAgent
    
    ActionAgent --> OutboxMail
    ActionAgent --> DBStore
    ActionAgent --> SupervisorAlert
    RestAPI --> DailyPDF

    Intake -.->|Event Stream| SSE
    Classifier -.->|Event Stream| SSE
    Retrieval -.->|Event Stream| SSE
    SentimentRisk -.->|Event Stream| SSE
    ResponseAgent -.->|Event Stream| SSE
    QAAgent -.->|Event Stream| SSE
    ActionAgent -.->|Event Stream| SSE
    SSE -.-> UI
```

---

## 2. Specialized Agent Roles & Cognitive Boundaries

| Agent Name | Model / Logic | Input | Output Schema | Primary Responsibility |
|---|---|---|---|---|
| **Intake Orchestrator** | Python / FastAPI | Raw user message & metadata | `AgentState` initialization | Validates input, assigns tracking `ticket_id`, sets initial timestamps. |
| **Classifier Agent** | Gemini 2.0 Flash / Mock | Customer support message | `ClassificationOutput` | Detects category (`technical`, `billing`, `plan inquiry`, `service request`, `other`), urgency priority (`low`, `medium`, `high`, `critical`), language (`ar`/`en`), and customer sentiment. |
| **Retrieval Agent** | PyMuPDF + Cosine Similarity | Query, Customer ID, Region | `RetrievalOutput` + `List[Citation]` | Gathers multi-source facts: chunks from indexed PDFs, subscriber balance/quota from Google Sheets/CSV, and outage status from Network API. |
| **Sentiment & Risk Agent** | Gemini 2.0 Flash / Mock | Message, Category | `SentimentRiskOutput` | Runs **concurrently in parallel** with retrieval; scores churn risk, detects regulatory threats (NTRA), and flags supervisor escalation. |
| **Response Agent** | Gemini 2.0 Flash / Context Prompt | Message, Classification, Citations, Account | `ResponseOutput` | Generates empathetic, grounded response in customer's native language with actionable troubleshooting steps. |
| **QA Audit Agent** | Gemini 2.0 Flash / Strict Checker | Draft response, Citations, SLAs | `QAOutput` | Evaluates factual truth, SLA limits, and false promises. Returns pass/fail; triggers loopback to Response Agent if criteria fail. |
| **Action Agent** | Python Automation Services | Approved state & tickets | `ActionOutput` | Writes email to `/outbox` or SMTP, persists ticket in SQLite, appends row to Google Sheets/CSV, and sends supervisor alert. |

---

## 3. Data Retrieval Architecture (3 Distinct Sources)

1. **PDF Knowledge Base (Unstructured)**:
   - `telecom_plans_pricing.pdf`: Contains package specs, throttle thresholds, and add-on rates.
   - `support_sla_policies.pdf`: Contains standard troubleshooting protocols, VPI/VCI settings, and SLA refund deadlines.
   - Extracted using **PyMuPDF**, chunked into overlapping segments, and indexed for semantic keyword/cosine similarity retrieval.
2. **Google Sheets / Local CSV (Structured Accounts & FAQs)**:
   - `customers.csv`: Active subscriber profiles (account balance, remaining quota, active plan, billing due dates).
   - `faqs.csv`: Verified canonical answers to standard questions.
   - Syncs dynamically using `gspread` when Google Cloud credentials are provided, or seamlessly falls back to local CSV storage.
3. **External Network Health API (REST Service)**:
   - Regional node endpoints (Cairo, Giza, Alexandria, Mansoura) returning real-time cabinet status, fiber cut alerts, and scheduled maintenance windows.

---

## 4. LangGraph State Machine & Feedback Loop

The core orchestration is implemented with **LangGraph's `StateGraph`**:
```python
workflow = StateGraph(AgentState)
workflow.add_node("intake", intake_node)
workflow.add_node("classifier", classifier_node)
workflow.add_node("parallel_branch", parallel_branch_node) # asyncio.gather(retrieval, sentiment)
workflow.add_node("response", response_node)
workflow.add_node("qa", qa_node)
workflow.add_node("action", action_node)

workflow.set_entry_point("intake")
workflow.add_edge("intake", "classifier")
workflow.add_edge("classifier", "parallel_branch")
workflow.add_edge("parallel_branch", "response")
workflow.add_edge("response", "qa")

# Conditional Loopback Edge
workflow.add_conditional_edges("qa", route_qa, {
    "response": "response", # Retries if QA failed (< 2 times)
    "action": "action"      # Proceeds once approved
})
workflow.add_edge("action", END)
```

---

## 5. Security & Demoware Reliability Guardrails

- **Zero-Crash Multi-Model Fallback**: Seamless fallback across candidate Gemini models (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, etc.) with explicit fallback logging (`[MOCK_FALLBACK]`) and offline telecom domain engine backup.
- **Input Sanitization (Pattern-based Heuristics)**: Implemented in `sanitize_user_input()` inside `backend/app/graph/workflow.py`. A lightweight regex-based heuristic layer that strips HTML/script tags, neutralizes common line-anchored jailbreak keywords (`ignore instructions`, `developer mode`, `system:` prefixes), and enforces length boundaries to prevent prompt clutter.
- **Dry-Run Email Outbox**: Saves outgoing messages as standard `.eml` and styled `.html` files in `backend/data/outbox/` without requiring external SMTP credentials. Real SMTP delivery is only attempted when credentials are fully configured.
