# 🎬 Orange Smart Support Agent - Video Presentation & Demo Script

**Project Title**: Orange Smart Support Agent - Multi-Agent AI System  
**Duration**: 5 - 7 Minutes  
**Format**: Face-cam introduction & conclusion + Screen-share live walkthrough

---

## ⏱️ Timeline Overview

| Section | Timestamp | Focus |
|---|---|---|
| **Part 1: Introduction & Problem** | 0:00 - 1:00 | Project background, telecom support challenges, multi-agent objective. |
| **Part 2: Architecture & LangGraph** | 1:00 - 2:30 | LangGraph DAG, 6 specialized agents, parallel execution, QA loop. |
| **Part 3: Live System Demo** | 2:30 - 5:00 | Live run of the 3 key scenarios on the web console. |
| **Part 4: Testing & Evaluation Suite** | 5:00 - 6:00 | 15-test dataset benchmark, KPIs, and accuracy metrics. |
| **Part 5: Google Colab Notebook** | 6:00 - 6:40 | Single self-contained Colab notebook overview. |
| **Part 6: Conclusion & Wrap-Up** | 6:40 - 7:00 | Key takeaways and closing remarks. |

---

## 🎙️ Detailed Script & Presentation Walkthrough

### Part 1: Introduction & Problem Statement (0:00 - 1:00)
**[Visual: Face-Cam full screen]**

> *"Hello everyone! My name is [Your Name], and welcome to my final project presentation for the AI Agents Course: **The Orange Smart Support Agent**.*
>
> *Telecom customer support is one of the most high-volume, demanding environments in the industry. Subscribers face issues ranging from sudden internet slowdowns and router sync problems to unexpected billing deductions and plan changes. Traditional chatbots rely on rigid decision trees that frustrate customers.*
>
> *Unlike mid-term question-answering systems, my goal for this final project was to design and build a **fully autonomous, multi-agent AI system** powered by **LangGraph** and **Google Gemini**, capable of performing end-to-end multi-step reasoning, multi-source data retrieval, quality assurance auditing, and automated downstream actions—all accessible through a sleek, bilingual web application."*

---

### Part 2: Architecture & LangGraph DAG (1:00 - 2:30)
**[Visual: Switch to Screen Share: Navigate to the 'How It Works' tab in the Web App]**

> *"Let’s look at the system architecture here on our **How It Works** page.*
>
> *The orchestration pipeline is built using **LangGraph**, structuring our multi-agent workflow as a stateful Directed Acyclic Graph with self-correcting feedback loops:*
>
> 1. ***Intake Orchestrator**: Sanitizes input, assigns a unique Ticket ID, and initializes our typed state.*
> 2. ***Classifier Agent**: Uses Gemini with a Pydantic schema to extract intent category, priority, language (Arabic or English), and customer sentiment.*
> 3. ***Concurrent Parallel Branch**: Here is a key architectural feature—we run two agents in parallel using `asyncio.gather`:*
>    - *The **Retrieval Agent** pulls data from **three distinct source types**: RAG chunks from PyMuPDF-indexed telecom plans and SLA PDFs, subscriber balances from Google Sheets/CSV, and live outage information from a regional Network Health API.*
>    - *Concurrently, the **Sentiment & Risk Agent** assesses customer churn probability and flags critical escalation triggers.*
> 4. ***Response Agent**: Drafts an empathetic, technically accurate reply in the customer’s native language grounded strictly in verified context.*
> 5. ***QA Audit Agent**: An independent auditor that verifies factual accuracy, checks for false promises, and ensures brand safety. If QA finds a flaw, LangGraph triggers a conditional loop back to the Response Agent for up to two revisions.*
> 6. ***Action Agent**: Finally, the system executes real-world automations: generating customer resolution emails into the outbox, saving tickets in SQLite, syncing to Google Sheets, and alerting human supervisors if escalation is needed.*
>
> *Let's see this in action live!"*

---

### Part 3: Live Demonstration of 3 Key Scenarios (2:30 - 5:00)
**[Visual: Switch to 'Live Console' tab]**

#### Scenario 1: Technical Slowdown in Arabic
**[Click on the 'النت بطيء جدا من امبارح' chip -> Click 'Process Request']**

> *"Let's test our first scenario: An Arabic technical complaint: `النت بطيء جدا من امبارح ومش عارف اشتغل خالص`.*
>
> *Notice our live Server-Sent Events (SSE) stream in real-time:*
> - *The **Classifier Agent** instantly identified the category as `technical`, priority `high`, and language `Arabic`.*
> - *The **Parallel Branch** retrieved our official Home DSL package specs and checked the Cairo network exchange node.*
> - *The **Response Agent** generated step-by-step troubleshooting instructions: power-cycling the router for 30 seconds and checking the DSL indicator light.*
> - *The **QA Agent** audited the message and awarded a **96% approval score**.*
> - *The **Action Agent** created ticket `ORG-xxxx`, dispatched an email, and recorded the event with a latency under 1.5 seconds! Down here you can see the exact citations from our knowledge base."*

#### Scenario 2: Billing Add-on Dispute in Arabic
**[Click on the 'خصم رصيد بدون إشعار' chip -> Click 'Process Request']**

> *"Now for Scenario 2: A common billing dispute: `تم خصم 30 جنيه من رصيدي وانا مشتريتش باقة اضافية رجعولي فلوسي!`.*
>
> *Watch the pipeline:*
> - *The agent classifies it under `billing`.*
> - *The retrieval agent queries the customer's account in `customers.csv` (Ahmed Hassan, Home DSL 140GB) and cross-references the official pricing policy PDF.*
> - *The response politely clarifies that according to fair usage policy terms, a 5GB extra bundle (30 EGP) auto-renews upon quota depletion, and provides the exact USSD code (`#100#`) to manage auto-renewal.*
> - *No human intervention required—resolved automatically in seconds."*

#### Scenario 3: Extreme Customer Anger & Regulatory Threat (NTRA)
**[Click on the 'تهديد بالجهاز القومي للاتصالات' chip -> Click 'Process Request']**

> *"Now let's test an edge case with severe churn risk and regulatory danger: `خدمتكم سيئة جدا وحرامية هرفع شكوى للجهاز القومي لتنظيم الاتصالات وهلغي كل خطوطي!`.*
>
> *Notice what happens:*
> - *The **Risk & Sentiment Agent** detected `angry` sentiment, a sentiment score of `-0.85`, and critical churn risk.*
> - *Look at the UI: The **Supervisor Escalation Alert** banner triggered in red!*
> - *The Action Agent dispatched an urgent notification to the supervisor's escalation queue in `/outbox` and flagged the ticket in the database for immediate human takeover.*
> *This demonstrates safety guardrails and deterministic risk mitigation in action."*

---

### Part 4: Testing & Evaluation Suite (5:00 - 6:00)
**[Visual: Switch to 'Evaluation' tab -> Click 'Run 15-Test Evaluation Benchmark']**

> *"Moving on to Requirement 6: Testing & Evaluation.*
>
> *I constructed a comprehensive dataset of 15 realistic customer messages mixing Arabic and English across technical, billing, plan inquiries, and edge cases.*
>
> *When we click 'Run Evaluation Suite', the runner tests each case through the multi-agent pipeline and records precision metrics:*
> - *Classification Accuracy: **93.3%** (exceeding our 90% benchmark).*
> - *Escalation Accuracy: **100.0%** (exceeding our 85% benchmark).*
> - *QA Pass Rate: **100.0%**.*
> - *Average End-to-End Latency: **~2.3 seconds**.*
> - *Pipeline Failure Rate: **0.0%**.*
>
> *Every single run is logged with full transparency in our execution ledger."*

---

### Part 5: Google Colab Notebook Walkthrough (6:00 - 6:40)
**[Visual: Switch tab to Google Colab Notebook `orange_smart_support_colab.ipynb`]**

> *"In addition to the web application, the entire multi-agent system is packaged into a **single, standalone Google Colab Notebook** (`orange_smart_support_colab.ipynb`).*
>
> *It installs dependencies in one click, builds the LangGraph pipeline, indexes the dummy PDFs and customer records, and demonstrates all three scenarios with rich markdown summaries without needing any local server setup."*

---

### Part 6: Conclusion (6:40 - 7:00)
**[Visual: Face-Cam full screen]**

> *"To summarize: We designed, built, and evaluated the **Orange Smart Support Agent**—a production-grade multi-agent system combining LangGraph orchestration, multi-source RAG, parallel agent execution, automated QA guardrails, and real-world actions.*
>
> *Thank you for your time, and I look forward to your questions and feedback!"*
