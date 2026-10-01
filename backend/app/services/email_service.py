import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

from app.config import settings

class EmailService:
    def __init__(self):
        self.outbox_dir = settings.OUTBOX_DIR
        self.outbox_dir.mkdir(parents=True, exist_ok=True)

    def send_customer_email(
        self,
        recipient_email: str,
        ticket_id: str,
        subject: str,
        customer_name: str,
        reply_content: str,
        actions: list
    ) -> Dict[str, Any]:
        """Send resolution email to customer or write to /outbox in dry-run mode."""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7; margin: 0; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }}
                .header {{ background-color: #000000; padding: 24px; text-align: center; border-bottom: 4px solid #FF7900; }}
                .header h1 {{ color: #FF7900; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }}
                .content {{ padding: 28px; color: #333333; line-height: 1.6; font-size: 15px; }}
                .ticket-badge {{ display: inline-block; background: #FFF3E6; color: #D65A00; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 13px; margin-bottom: 16px; border: 1px solid #FFE0B2; }}
                .reply-box {{ background: #fafafa; border-left: 4px solid #FF7900; padding: 16px; border-radius: 0 6px 6px 0; margin: 20px 0; font-size: 15px; }}
                .action-list {{ background: #fdfdfd; padding: 14px 20px; border-radius: 6px; border: 1px solid #eeeeee; }}
                .footer {{ background: #fafafa; padding: 18px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Orange Smart Support</h1>
                </div>
                <div class="content">
                    <div class="ticket-badge">Ticket #{ticket_id}</div>
                    <p>Dear <b>{customer_name or 'Valued Customer'}</b>,</p>
                    <p>Thank you for reaching out to Orange Support. Our automated multi-agent system has processed your request:</p>
                    <div class="reply-box">
                        {reply_content.replace(chr(10), '<br/>')}
                    </div>
                    {f'<div class="action-list"><b>Recommended Next Steps:</b><ul>' + ''.join(f'<li>{a}</li>' for a in actions) + '</ul></div>' if actions else ''}
                    <p style="margin-top: 24px;">If you have any further questions, please reply directly to this message or track your ticket on the <b>My Orange</b> app.</p>
                </div>
                <div class="footer">
                    &copy; 2026 Orange Telecom. All rights reserved.<br/>
                    <small style="color: #999;">Demo project, not affiliated with Orange.</small>
                </div>
            </div>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = recipient_email
        msg.attach(MIMEText(reply_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        outbox_file = None
        sent = False

        # Attempt SMTP if configured
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
                    server.starttls()
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.send_message(msg)
                sent = True
            except Exception as e:
                print(f"SMTP send failed: {e}. Writing to outbox fallback.")

        # Always write to outbox in dry-run mode or as backup
        clean_time = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        eml_filename = f"email_{ticket_id}_{clean_time}.eml"
        html_filename = f"email_{ticket_id}_{clean_time}.html"

        eml_path = self.outbox_dir / eml_filename
        html_path = self.outbox_dir / html_filename

        with open(eml_path, "wb") as f:
            f.write(msg.as_bytes())
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        return {
            "sent": bool(sent),
            "saved_to_outbox": True,
            "recipient": recipient_email,
            "outbox_path": str(html_path.resolve())
        }

    def send_escalation_alert(
        self,
        ticket_id: str,
        customer_id: str,
        reason: str,
        customer_message: str
    ) -> Dict[str, Any]:
        """Send urgent escalation alert to the human on-duty supervisor."""
        clean_time = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        alert_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background: #FFF5F5; padding: 20px;">
            <div style="background: white; border: 2px solid #E53E3E; border-radius: 8px; padding: 20px; max-width: 600px; margin: auto;">
                <h2 style="color: #E53E3E; margin-top: 0;">🚨 ESCALATION ALERT: Immediate Supervisor Attention Required</h2>
                <p><b>Ticket ID:</b> {ticket_id}</p>
                <p><b>Customer ID:</b> {customer_id}</p>
                <p><b>Trigger Reason:</b> <span style="background: #FED7D7; padding: 2px 6px; border-radius: 4px;">{reason}</span></p>
                <hr style="border: 0; border-top: 1px solid #FED7D7; margin: 15px 0;"/>
                <p><b>Customer Message:</b></p>
                <blockquote style="background: #F7FAFC; padding: 12px; border-left: 4px solid #CBD5E0; margin: 0;">
                    {customer_message}
                </blockquote>
                <p style="margin-top: 20px; font-size: 13px; color: #718096;">Action Agent dispatched this notification to senior escalation queue.</p>
            </div>
        </body>
        </html>
        """
        alert_file = self.outbox_dir / f"escalation_{ticket_id}_{clean_time}.html"
        with open(alert_file, "w", encoding="utf-8") as f:
            f.write(alert_html)

        return {
            "escalation_file": str(alert_file.resolve()),
            "status": "notified"
        }

email_service = EmailService()
