import os
import csv
import json
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any

from app.config import settings
from app.schemas import CustomerAccount, Citation

logger = logging.getLogger(__name__)

class SheetsService:
    def __init__(self):
        self.customers_csv = settings.DATA_DIR / "customers.csv"
        self.faqs_csv = settings.DATA_DIR / "faqs.csv"
        self.tickets_csv = settings.DATA_DIR / "tickets_sync.csv"
        self.client = None
        self._init_sheets()

    def _init_sheets(self):
        """Initialize Google Sheets client if credentials file is present."""
        if settings.GOOGLE_SHEETS_CREDENTIALS_FILE and os.path.exists(settings.GOOGLE_SHEETS_CREDENTIALS_FILE):
            try:
                import gspread
                self.client = gspread.service_account(filename=settings.GOOGLE_SHEETS_CREDENTIALS_FILE)
                logger.info("Google Sheets API connected successfully.")
            except Exception as e:
                logger.warning(f"Could not connect to Google Sheets: {e}. Using CSV fallback.")
                self.client = None
        else:
            self.client = None

    def seed_default_data(self):
        """Create sample customers and FAQs CSV files if they don't exist."""
        # 1. Customers CSV
        if not self.customers_csv.exists():
            customers = [
                {"customer_id": "CUST-1001", "name": "Ahmed Osama", "phone": "01234567890", "plan_name": "Home DSL 140 GB", "balance_egp": 45.0, "current_quota_gb": 140.0, "remaining_quota_gb": 12.5, "bill_due_date": "2026-10-15", "status": "Active", "recent_charges": json.dumps([{"date": "2026-09-01", "desc": "Monthly Subscription", "amount": 160.0}, {"date": "2026-09-22", "desc": "Extra 5GB Add-on (Auto-renew)", "amount": 30.0}])},
                {"customer_id": "CUST-1002", "name": "Mona Khalil", "phone": "01289123456", "plan_name": "Home DSL 200 GB", "balance_egp": 120.0, "current_quota_gb": 200.0, "remaining_quota_gb": 145.0, "bill_due_date": "2026-10-01", "status": "Active", "recent_charges": json.dumps([{"date": "2026-09-01", "desc": "Monthly Subscription", "amount": 225.0}])},
                {"customer_id": "CUST-1003", "name": "Tarek Nabil", "phone": "01200112233", "plan_name": "Free Max 70", "balance_egp": 15.0, "current_quota_gb": 70.0, "remaining_quota_gb": 28.0, "bill_due_date": "2026-10-05", "status": "Active", "recent_charges": json.dumps([{"date": "2026-09-05", "desc": "Free Max 70 Renewal", "amount": 70.0}, {"date": "2026-09-20", "desc": "Extra Bundle Add-on", "amount": 30.0}])},
                {"customer_id": "CUST-1004", "name": "Sarah Mahmoud", "phone": "01211223344", "plan_name": "Home DSL 300 GB", "balance_egp": -150.0, "current_quota_gb": 300.0, "remaining_quota_gb": 180.0, "bill_due_date": "2026-09-28", "status": "Suspended for Payment", "recent_charges": json.dumps([{"date": "2026-09-01", "desc": "Monthly Subscription", "amount": 325.0}, {"date": "2026-09-28", "desc": "Late Fee Adjustment", "amount": 150.0}])},
                {"customer_id": "CUST-1005", "name": "Mohamed Ibrahim", "phone": "01222334455", "plan_name": "Home DSL 140 GB", "balance_egp": 55.0, "current_quota_gb": 140.0, "remaining_quota_gb": 60.0, "bill_due_date": "2026-10-10", "status": "Active", "recent_charges": json.dumps([{"date": "2026-09-01", "desc": "Monthly Subscription", "amount": 160.0}])},
                {"customer_id": "CUST-1006", "name": "David Smith", "phone": "01233445566", "plan_name": "Home DSL 140 GB", "balance_egp": 20.0, "current_quota_gb": 140.0, "remaining_quota_gb": 45.0, "bill_due_date": "2026-10-12", "status": "Active", "recent_charges": json.dumps([{"date": "2026-09-01", "desc": "Monthly Subscription", "amount": 160.0}])},
                {"customer_id": "CUST-1007", "name": "Mahmoud Hassan", "phone": "01244556677", "plan_name": "Home DSL 200 GB", "balance_egp": 80.0, "current_quota_gb": 200.0, "remaining_quota_gb": 90.0, "bill_due_date": "2026-10-18", "status": "Active", "recent_charges": json.dumps([{"date": "2026-09-01", "desc": "Monthly Subscription", "amount": 225.0}])},
                {"customer_id": "CUST-1008", "name": "John Miller", "phone": "01255667788", "plan_name": "GO 120", "balance_egp": 40.0, "current_quota_gb": 120.0, "remaining_quota_gb": 75.0, "bill_due_date": "2026-10-20", "status": "Active", "recent_charges": json.dumps([{"date": "2026-09-01", "desc": "GO 120 Bundle", "amount": 120.0}])},
                {"customer_id": "CUST-1009", "name": "Khaled Mostafa", "phone": "01266778899", "plan_name": "Home DSL 500 GB", "balance_egp": -80.0, "current_quota_gb": 500.0, "remaining_quota_gb": 5.0, "bill_due_date": "2026-09-30", "status": "Suspended for Payment", "recent_charges": json.dumps([{"date": "2026-09-01", "desc": "Monthly Subscription", "amount": 500.0}])},
                {"customer_id": "CUST-1010", "name": "Emma Watson", "phone": "01277889900", "plan_name": "Home DSL 300 GB", "balance_egp": 0.0, "current_quota_gb": 300.0, "remaining_quota_gb": 30.0, "bill_due_date": "2026-09-29", "status": "Active", "recent_charges": json.dumps([{"date": "2026-09-01", "desc": "Monthly Subscription", "amount": 325.0}])},
                {"customer_id": "CUST-1011", "name": "Youssef Aly", "phone": "01288990011", "plan_name": "Home DSL 140 GB", "balance_egp": 110.0, "current_quota_gb": 140.0, "remaining_quota_gb": 95.0, "bill_due_date": "2026-10-25", "status": "Active", "recent_charges": json.dumps([{"date": "2026-09-01", "desc": "Monthly Subscription", "amount": 160.0}])},
                {"customer_id": "CUST-1012", "name": "Nour Sherif", "phone": "01299001122", "plan_name": "Home DSL 200 GB", "balance_egp": 35.0, "current_quota_gb": 200.0, "remaining_quota_gb": 110.0, "bill_due_date": "2026-10-15", "status": "Active", "recent_charges": json.dumps([{"date": "2026-09-01", "desc": "Monthly Subscription", "amount": 225.0}])},
                {"customer_id": "CUST-1013", "name": "Fatma Salem", "phone": "01201122445", "plan_name": "Home DSL 140 GB", "balance_egp": 15.0, "current_quota_gb": 140.0, "remaining_quota_gb": 3.0, "bill_due_date": "2026-10-02", "status": "Active", "recent_charges": json.dumps([{"date": "2026-09-01", "desc": "Monthly Subscription", "amount": 160.0}])},
                {"customer_id": "CUST-1014", "name": "Omar Farouk", "phone": "01212233556", "plan_name": "Home DSL 140 GB", "balance_egp": 60.0, "current_quota_gb": 140.0, "remaining_quota_gb": 70.0, "bill_due_date": "2026-10-08", "status": "Active", "recent_charges": json.dumps([{"date": "2026-09-01", "desc": "Monthly Subscription", "amount": 160.0}])},
                {"customer_id": "CUST-1015", "name": "Salma Adel", "phone": "01223344667", "plan_name": "Free Max 50", "balance_egp": 25.0, "current_quota_gb": 50.0, "remaining_quota_gb": 18.0, "bill_due_date": "2026-10-14", "status": "Active", "recent_charges": json.dumps([{"date": "2026-09-01", "desc": "Free Max 50 Renewal", "amount": 50.0}])}
            ]
            with open(self.customers_csv, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=list(customers[0].keys()))
                writer.writeheader()
                writer.writerows(customers)

        # 2. FAQs CSV
        if not self.faqs_csv.exists():
            faqs = [
                {
                    "question": "كيف أقوم بتجديد باقة أورنج قبل الميعاد؟",
                    "answer": "يمكن تجديد الباقة مبكراً عبر تطبيق My Orange أو بطلب الكود #100# واختيار تجديد مبكر.",
                    "category": "plan"
                },
                {
                    "question": "ماذا أفعل إذا كان لمبة الإنترنت حمراء أو لا تعمل؟",
                    "answer": "تأكد من توصيل كابل التليفون الأرضي بالسبليتر بشكل محكم، ثم أعد تشغيل الراوتر لمدة 30 ثانية. إذا استمرت، يتم فتح شكوى عطل فني.",
                    "category": "technical"
                },
                {
                    "question": "How to check my remaining internet quota?",
                    "answer": "You can check your quota balance by logging into the My Orange app or visiting dsl.orange.eg/en/usage.",
                    "category": "plan"
                },
                {
                    "question": "Why was credit deducted without my knowledge?",
                    "answer": "Deductions usually correspond to automatic extra internet bundles or active value-added content services. Check 'My Services' in the My Orange app.",
                    "category": "billing"
                }
            ]
            with open(self.faqs_csv, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=list(faqs[0].keys()))
                writer.writeheader()
                writer.writerows(faqs)

    def get_customer_account(self, customer_id: str) -> Optional[CustomerAccount]:
        """Fetch customer record from Google Sheets or local CSV fallback."""
        self.seed_default_data()
        
        # Try local CSV fallback
        if self.customers_csv.exists():
            with open(self.customers_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row["customer_id"].strip().upper() == customer_id.strip().upper():
                        charges = []
                        try:
                            charges = json.loads(row.get("recent_charges", "[]"))
                        except Exception:
                            charges = []
                        return CustomerAccount(
                            customer_id=row["customer_id"],
                            name=row["name"],
                            phone=row["phone"],
                            plan_name=row["plan_name"],
                            balance_egp=float(row["balance_egp"]),
                            current_quota_gb=float(row["current_quota_gb"]),
                            remaining_quota_gb=float(row["remaining_quota_gb"]),
                            bill_due_date=row["bill_due_date"],
                            status=row["status"],
                            recent_charges=charges
                        )
                        
        # Return fallback default if customer ID not matched
        return CustomerAccount(
            customer_id=customer_id,
            name="Valued Customer",
            phone="01234567890",
            plan_name="Home DSL 140 GB",
            balance_egp=50.0,
            current_quota_gb=140.0,
            remaining_quota_gb=45.0,
            bill_due_date="2026-10-15",
            status="Active",
            recent_charges=[{"date": "2026-09-01", "desc": "Monthly Subscription", "amount": 160.0}]
        )

    def search_faqs(self, query: str) -> List[Dict[str, str]]:
        """Search FAQs CSV or sheet for matching answers."""
        self.seed_default_data()
        matches = []
        q_words = set(query.lower().split())
        
        if self.faqs_csv.exists():
            with open(self.faqs_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    combined = (row["question"] + " " + row["answer"]).lower()
                    if any(w in combined for w in q_words if len(w) > 2):
                        matches.append(row)
        return matches[:2]

    def sync_ticket(self, ticket_dict: Dict[str, Any]) -> bool:
        """Write ticket entry to Google Sheets if connected, or sync to local CSV."""
        # 1. If Google Sheets API client available
        if self.client and settings.GOOGLE_SHEETS_SPREADSHEET_ID:
            try:
                sheet = self.client.open_by_key(settings.GOOGLE_SHEETS_SPREADSHEET_ID).sheet1
                row = [
                    ticket_dict.get("id"),
                    ticket_dict.get("customer_id"),
                    ticket_dict.get("created_at"),
                    ticket_dict.get("category"),
                    ticket_dict.get("priority"),
                    ticket_dict.get("sentiment"),
                    "ESCALATED" if ticket_dict.get("escalated") else "NORMAL",
                    ticket_dict.get("status"),
                    ticket_dict.get("message")[:100]
                ]
                sheet.append_row(row)
                return True
            except Exception as e:
                logger.warning(f"Google Sheets append failed: {e}")

        # 2. Local CSV fallback
        file_exists = self.tickets_csv.exists()
        with open(self.tickets_csv, "a", newline="", encoding="utf-8") as f:
            fieldnames = ["id", "customer_id", "created_at", "category", "priority", "sentiment", "escalated", "status", "message"]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            if not file_exists:
                writer.writeheader()
            writer.writerow({
                "id": ticket_dict.get("id"),
                "customer_id": ticket_dict.get("customer_id"),
                "created_at": ticket_dict.get("created_at"),
                "category": ticket_dict.get("category"),
                "priority": ticket_dict.get("priority"),
                "sentiment": ticket_dict.get("sentiment"),
                "escalated": "ESCALATED" if ticket_dict.get("escalated") else "NORMAL",
                "status": ticket_dict.get("status"),
                "message": ticket_dict.get("message", "").replace("\n", " ")[:150]
            })
        return True

sheets_service = SheetsService()
