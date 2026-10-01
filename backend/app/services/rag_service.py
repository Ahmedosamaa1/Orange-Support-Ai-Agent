import os
import math
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple
import pymupdf as fitz
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.config import settings
from app.schemas import Citation

class RAGService:
    def __init__(self):
        self.chunks: List[Dict[str, Any]] = []
        self.is_indexed = False

    def generate_dummy_pdfs(self):
        """Generate realistic dummy telecom knowledge PDFs if they don't already exist."""
        pdf_dir = settings.PDFS_DIR
        pdf_dir.mkdir(parents=True, exist_ok=True)
        
        plans_pdf = pdf_dir / "telecom_plans_pricing.pdf"
        sla_pdf = pdf_dir / "support_sla_policies.pdf"

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#FF7900'),
            spaceAfter=14
        )
        body_style = styles['Normal']
        
        # 1. Generate Plans & Pricing PDF
        if not plans_pdf.exists():
            doc = SimpleDocTemplate(str(plans_pdf), pagesize=letter)
            story = [
                Paragraph("Orange Telecom - Official Plans, Pricing & Quotas 2026", title_style),
                Spacer(1, 10),
                Paragraph("This document contains official specifications for Home DSL and Mobile Internet packages.", body_style),
                Spacer(1, 10),
                Paragraph("<b>Home DSL Packages:</b><br/>"
                          "- Home DSL 140 GB: Up to 30 Mbps speed, 160 EGP / month. Throttled to 256 Kbps upon quota exhaustion.<br/>"
                          "- Home DSL 250 GB: Up to 30 Mbps speed, 280 EGP / month. Includes complimentary router rental.<br/>"
                          "- Home DSL 400 GB: Up to 70 Mbps VDSL speed, 440 EGP / month. Free priority support.<br/>"
                          "- Home DSL 600 GB: Up to 100 Mbps Super VDSL speed, 650 EGP / month. Priority technician dispatch within 4 hours.", body_style),
                Spacer(1, 12),
                Paragraph("<b>Mobile Data Add-Ons (GO Packages):</b><br/>"
                          "- GO 10 EGP: 1,000 MB valid for 7 days.<br/>"
                          "- GO 30 EGP: 3,000 MB valid for 28 days.<br/>"
                          "- GO 70 EGP: 8,500 MB valid for 28 days.<br/>"
                          "- Auto-renewal feature: An extra 5GB package (30 EGP) is automatically charged if user enables auto-renew.", body_style),
                Spacer(1, 12),
                Paragraph("<b>Fair Usage & Quota Reset:</b><br/>"
                          "Monthly billing cycle resets on the 1st or 15th of each calendar month. Additional top-ups do not roll over to the next month.", body_style)
            ]
            doc.build(story)

        # 2. Generate Support Policies & SLA PDF
        if not sla_pdf.exists():
            doc = SimpleDocTemplate(str(sla_pdf), pagesize=letter)
            story = [
                Paragraph("Orange Telecom - Customer Support Policies & Service Level Agreements (SLA)", title_style),
                Spacer(1, 10),
                Paragraph("Standard operating guidelines for customer care diagnostics, billing dispute resolution, and escalation matrix.", body_style),
                Spacer(1, 10),
                Paragraph("<b>Service Level Agreements (SLA):</b><br/>"
                          "- Critical Outage (Complete line loss, business accounts): Resolution within 4 hours.<br/>"
                          "- Technical Degradation (Slow internet, intermittent disconnects): Diagnostic in 15 mins, resolution within 24 hours.<br/>"
                          "- Billing Disputes: Review within 2 hours, automated credit refund within 2-3 business days upon audit confirmation.<br/>"
                          "- Service Requests (SIM Swap, Plan upgrade): Instant to 2 hours.", body_style),
                Spacer(1, 12),
                Paragraph("<b>Standard Technical Troubleshooting Protocol:</b><br/>"
                          "Step 1: Perform digital Line Test & Port Reset from backend system.<br/>"
                          "Step 2: Instruct customer to power off router for 30 seconds to refresh DHCP lease.<br/>"
                          "Step 3: Ensure DSL/Broadband light is solid green. VPI/VCI settings should be 0/35.<br/>"
                          "Step 4: If SNR margin is below 6 dB or line attenuation exceeds 45 dB, dispatch field engineer.", body_style),
                Spacer(1, 12),
                Paragraph("<b>Customer Sentiment & Escalation Matrix:</b><br/>"
                          "Any customer exhibiting extreme frustration, threatening regulatory action (NTRA 155), or reporting 3+ unresolved tickets within 7 days must be immediately escalated to a Senior Technical Supervisor.<br/>"
                          "Official hotlines: 110 (Mobile), 16333 (DSL/Fiber Support), 16110 (General inquiries).", body_style),
                Spacer(1, 12),
                Paragraph("<b>Privacy & Financial Balance Policy:</b><br/>"
                          "Customer financial balance and wallet funds are strictly protected. Support agents and AI systems are strictly prohibited from stating customer balance amounts. Customers must be directed to view real-time balance on the My Orange App or dial USSD #100# or #100#3#.", body_style)
            ]
            doc.build(story)

    def index_documents(self):
        """Read PDFs using PyMuPDF and prepare searchable chunks."""
        self.generate_dummy_pdfs()
        self.chunks = []
        pdf_dir = settings.PDFS_DIR

        for pdf_file in pdf_dir.glob("*.pdf"):
            try:
                doc = fitz.open(str(pdf_file))
                for page_idx, page in enumerate(doc):
                    text = page.get_text("text").strip()
                    if not text:
                        continue
                    # Split into meaningful paragraphs
                    paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
                    for para in paragraphs:
                        self.chunks.append({
                            "source_title": pdf_file.name.replace(".pdf", "").replace("_", " ").title(),
                            "source_file": pdf_file.name,
                            "page": page_idx + 1,
                            "text": para
                        })
                doc.close()
            except Exception as e:
                print(f"Error reading PDF {pdf_file}: {e}")

        self.is_indexed = True

    def search(self, query: str, top_k: int = 3) -> List[Citation]:
        """Perform semantic keyword-weighted search over indexed chunks and return citations."""
        if not self.is_indexed or not self.chunks:
            self.index_documents()

        q_words = set(re.findall(r'\w+', query.lower()))
        if not q_words:
            q_words = {"internet", "plan", "support"}

        scored_chunks: List[Tuple[float, Dict[str, Any]]] = []
        for chunk in self.chunks:
            chunk_text = chunk["text"].lower()
            # Calculate match score based on word occurrence & density
            score = 0.0
            for word in q_words:
                if len(word) > 2:
                    if word in chunk_text:
                        score += 1.5 + (0.5 if word in chunk["source_title"].lower() else 0.0)
            
            # Boost domain relevant matches
            if any(term in query.lower() for term in ["slow", "بطيء", "قطع", "speed"]) and "troubleshooting" in chunk_text:
                score += 2.0
            if any(term in query.lower() for term in ["رصيد", "خصم", "bill", "charge"]) and "billing" in chunk_text:
                score += 2.0
            if any(term in query.lower() for term in ["plan", "باقة", "عرض", "dsl", "gb"]) and "dsl" in chunk_text:
                score += 2.0

            if score > 0:
                scored_chunks.append((score, chunk))

        # Sort by score descending
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_results = scored_chunks[:top_k]

        citations = []
        for score, chunk in top_results:
            confidence = min(0.98, max(0.70, round(score / (score + 2.0), 2)))
            citations.append(Citation(
                source_type="pdf_kb",
                source_title=f"{chunk['source_title']} (Page {chunk['page']})",
                snippet=chunk["text"],
                confidence=confidence
            ))
            
        # Fallback if no direct hit
        if not citations and self.chunks:
            chunk = self.chunks[0]
            citations.append(Citation(
                source_type="pdf_kb",
                source_title=f"{chunk['source_title']} (Page {chunk['page']})",
                snippet=chunk["text"][:250] + "...",
                confidence=0.75
            ))

        return citations

rag_service = RAGService()
