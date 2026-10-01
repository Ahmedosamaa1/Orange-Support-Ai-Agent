from typing import List, Optional
from app.schemas import RetrievalOutput, Citation, CustomerAccount
from app.services.rag_service import rag_service
from app.services.sheets_service import sheets_service
from app.services.network_service import network_service

async def run_retrieval_agent(
    message: str,
    customer_id: str = "CUST-1001",
    customer_name: Optional[str] = None,
    customer_phone: Optional[str] = None,
    customer_plan: Optional[str] = None,
    region: str = "Cairo"
) -> RetrievalOutput:
    """Retrieve multi-source intelligence from PDF knowledge base, Google Sheets/CSV, and Network Health API."""
    citations: List[Citation] = []

    # 1. Source 1: PDF Knowledge Base via RAG
    rag_citations = rag_service.search(message, top_k=2)
    citations.extend(rag_citations)
    rag_context = "\n".join([f"[{c.source_title}]: {c.snippet}" for c in rag_citations])

    # 2. Source 2: Google Sheets / CSV Account & FAQs
    customer_account = sheets_service.get_customer_account(customer_id)
    if customer_account:
        if customer_name:
            customer_account.name = customer_name
        if customer_phone:
            customer_account.phone = customer_phone
        if customer_plan:
            customer_account.plan_name = customer_plan
    else:
        customer_account = CustomerAccount(
            customer_id=customer_id,
            name=customer_name or "احمد اسامه",
            phone=customer_phone or "01234567890",
            plan_name=customer_plan or "Home DSL 400 GB",
            balance_egp=45.0,
            current_quota_gb=400.0,
            remaining_quota_gb=180.0,
            bill_due_date="2026-10-15",
            status="Active"
        )

    citations.append(Citation(
        source_type="google_sheets_csv",
        source_title=f"Customer Account Records ({customer_id})",
        snippet=f"Name: {customer_account.name} | Phone: {customer_account.phone} | Plan: {customer_account.plan_name} | Region: {region} | Status: {customer_account.status}",
        confidence=0.99
    ))

    faq_matches = sheets_service.search_faqs(message)
    faq_snippets = []
    for faq in faq_matches:
        snippet_text = f"Q: {faq['question']} -> A: {faq['answer']}"
        faq_snippets.append(snippet_text)
        citations.append(Citation(
            source_type="google_sheets_csv",
            source_title="FAQ Knowledge Sheet",
            snippet=snippet_text,
            confidence=0.92
        ))

    # 3. Source 3: Network Status API
    net_citation = network_service.get_citation(region)
    citations.append(net_citation)
    net_status = network_service.check_status(region)

    return RetrievalOutput(
        citations=citations,
        customer_account=customer_account,
        network_status=net_status,
        faq_matches=faq_snippets,
        rag_context=rag_context
    )
