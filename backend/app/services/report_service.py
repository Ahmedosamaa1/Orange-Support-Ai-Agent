import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.config import settings
from app.database import get_kpis, get_all_tickets

REPORTS_DIR = settings.DATA_DIR / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

class ReportService:
    def generate_daily_report(self) -> Dict[str, Any]:
        """Generate PDF & HTML executive summary reports of telecom tickets."""
        kpis = get_kpis()
        tickets = get_all_tickets(limit=10)
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        date_slug = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        
        pdf_path = REPORTS_DIR / f"orange_daily_report_{date_slug}.pdf"
        html_path = REPORTS_DIR / f"orange_daily_report_{date_slug}.html"

        # 1. Build PDF Report
        doc = SimpleDocTemplate(str(pdf_path), pagesize=letter)
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'RepTitle', parent=styles['Heading1'],
            fontSize=20, textColor=colors.HexColor('#FF7900'), spaceAfter=8
        )
        subtitle_style = ParagraphStyle(
            'RepSub', parent=styles['Normal'],
            fontSize=10, textColor=colors.HexColor('#666666'), spaceAfter=14
        )
        h2_style = ParagraphStyle(
            'RepH2', parent=styles['Heading2'],
            fontSize=13, textColor=colors.HexColor('#111111'), spaceBefore=12, spaceAfter=8
        )
        normal = styles['Normal']

        story = [
            Paragraph("Orange Smart Support - Daily Executive Report", title_style),
            Paragraph(f"Generated at: {now_str} | System: Multi-Agent AI Core", subtitle_style),
            Spacer(1, 10),
            Paragraph("<b>System Key Performance Indicators (KPIs)</b>", h2_style)
        ]

        # KPI Table
        kpi_data = [
            ["Metric", "Value", "Benchmark Target"],
            ["Total Processed Tickets", str(kpis["total_tickets"]), "N/A"],
            ["Average End-to-End Latency", f"{kpis['avg_response_time_ms']} ms", "< 3000 ms"],
            ["Supervisor Escalation Rate", f"{kpis['escalation_rate']}%", "< 15%"],
            ["QA Pass Rate (1st run)", f"{kpis['qa_pass_rate']}%", "> 90%"]
        ]
        kpi_table = Table(kpi_data, colWidths=[200, 150, 150])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#FF7900')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#FFF9F2')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E0D0C0'))
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 14))

        # Tickets by Category
        story.append(Paragraph("<b>Tickets by Category Breakdown</b>", h2_style))
        cat_data = [["Category", "Volume", "Share %"]]
        total = max(1, kpis["total_tickets"])
        for c in kpis["by_category"]:
            share = round((c["count"] / total) * 100, 1)
            cat_data.append([c["category"].title(), str(c["count"]), f"{share}%"])
        if len(cat_data) == 1:
            cat_data.append(["No tickets yet", "0", "0%"])

        cat_table = Table(cat_data, colWidths=[200, 150, 150])
        cat_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#333333')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#DDDDDD'))
        ]))
        story.append(cat_table)
        story.append(Spacer(1, 14))

        # Recent tickets summary
        story.append(Paragraph("<b>Recent Tickets & Escalation Log</b>", h2_style))
        recent_data = [["Ticket ID", "Category", "Priority", "Status", "Escalated"]]
        for t in tickets[:6]:
            recent_data.append([
                t["id"][:12],
                (t["category"] or "").title(),
                (t["priority"] or "").upper(),
                (t["status"] or "").capitalize(),
                "YES" if t["escalated"] else "No"
            ])
        if len(recent_data) == 1:
            recent_data.append(["No recent items", "-", "-", "-", "-"])

        rec_table = Table(recent_data, colWidths=[100, 100, 100, 100, 100])
        rec_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#555555')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#EEEEEE'))
        ]))
        story.append(rec_table)
        story.append(Spacer(1, 20))
        story.append(Paragraph("<font size=8 color='#999999'>Demo project, not affiliated with Orange. Confidential internal analytics.</font>", normal))

        doc.build(story)

        # 2. Build HTML Report
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Orange Smart Support - Daily Report</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; padding: 30px; }}
                .container {{ max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }}
                .header {{ border-bottom: 2px solid #FF7900; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }}
                h1 {{ color: #FF7900; margin: 0; font-size: 24px; }}
                .kpi-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }}
                .kpi-card {{ background: #fff8f0; border: 1px solid #ffd8a8; border-radius: 8px; padding: 16px; text-align: center; }}
                .kpi-val {{ font-size: 26px; font-weight: 700; color: #d9480f; margin-top: 4px; }}
                .kpi-lbl {{ font-size: 12px; text-transform: uppercase; color: #868e96; letter-spacing: 0.5px; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 24px; font-size: 14px; }}
                th, td {{ padding: 10px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; }}
                th {{ background: #f1f5f9; font-weight: 600; color: #475569; }}
                .badge {{ padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }}
                .badge-esc {{ background: #fee2e2; color: #dc2626; }}
                .badge-ok {{ background: #dcfce7; color: #16a34a; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div>
                        <h1>Orange Smart Support - Daily Report</h1>
                        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Generated at {now_str}</p>
                    </div>
                </div>
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-lbl">Total Tickets</div>
                        <div class="kpi-val">{kpis['total_tickets']}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-lbl">Avg Latency</div>
                        <div class="kpi-val">{kpis['avg_response_time_ms']}ms</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-lbl">Escalation Rate</div>
                        <div class="kpi-val">{kpis['escalation_rate']}%</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-lbl">QA Pass Rate</div>
                        <div class="kpi-val">{kpis['qa_pass_rate']}%</div>
                    </div>
                </div>

                <h3>Tickets by Category</h3>
                <table>
                    <thead><tr><th>Category</th><th>Volume</th></tr></thead>
                    <tbody>
                        {''.join(f"<tr><td>{c['category'].title()}</td><td><b>{c['count']}</b></td></tr>" for c in kpis['by_category'])}
                    </tbody>
                </table>

                <h3>Recent Tickets</h3>
                <table>
                    <thead><tr><th>ID</th><th>Category</th><th>Priority</th><th>Escalated</th></tr></thead>
                    <tbody>
                        {''.join(f"<tr><td>{t['id'][:12]}</td><td>{t['category'].title()}</td><td>{t['priority'].upper()}</td><td><span class='badge {'badge-esc' if t['escalated'] else 'badge-ok'}'>{'ESCALATED' if t['escalated'] else 'NORMAL'}</span></td></tr>" for t in tickets[:8])}
                    </tbody>
                </table>
                <p style="font-size: 11px; color: #94a3b8; margin-top: 30px; text-align: center;">Demo project, not affiliated with Orange.</p>
            </div>
        </body>
        </html>
        """
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        return {
            "pdf_filename": pdf_path.name,
            "html_filename": html_path.name,
            "pdf_path": str(pdf_path.resolve()),
            "html_path": str(html_path.resolve()),
            "generated_at": now_str
        }

report_service = ReportService()
