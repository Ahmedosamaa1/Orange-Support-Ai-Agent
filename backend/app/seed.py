import random
from datetime import datetime, timedelta
from app.database import init_db, save_ticket
from app.services.rag_service import rag_service
from app.services.sheets_service import sheets_service

def seed_all():
    print("🌱 Initializing SQLite Database...")
    init_db()

    print("📄 Generating Knowledge Base PDFs...")
    rag_service.generate_dummy_pdfs()
    rag_service.index_documents()

    print("📊 Seeding Dummy Customers & FAQs (CSV/Sheets)...")
    sheets_service.seed_default_data()

    print("🎫 Seeding Historical Sample Tickets for Dashboard...")
    categories = ["technical", "billing", "plan inquiry", "service request"]
    priorities = ["low", "medium", "high", "critical"]
    sentiments = ["happy", "neutral", "frustrated", "angry"]
    sample_issues = [
        ("سرعة النت بتنزل جدا كل يوم بالليل في المعادي ومش عارف اشتغل", "technical", "high", "frustrated", "frustrated", -0.6, False, "أحمد أسامة", "01288997766", "Home DSL 400 GB (100 Mbps)", "Cairo", "unopened"),
        ("تم خصم 30 جنيه باقة إضافية بدون ما يوصلني أي رسالة تنبيه برصيدي", "billing", "medium", "frustrated", "frustrated", -0.4, False, "سارة إبراهيم", "01233445566", "Home DSL 200 GB", "Giza", "unopened"),
        ("عايز استفسر عن أسعار باقات النت المنزلي الـ 300 جيجا وعروض الترقية", "plan inquiry", "low", "happy", "satisfied", 0.8, False, "أحمد أسامة", "01288997766", "Home DSL 400 GB (100 Mbps)", "Giza", "reviewed_and_handled"),
        ("النت فاصل تماماً من الصبح وشغلي كله واقف والراوتر لمبة الـ DSL مش بتنور", "technical", "critical", "angry", "angry", -0.9, True, "كريم عادل", "01277889900", "Home DSL 500 GB", "Alexandria", "needs_followup"),
        ("شكراً لكم تم تفعيل الشريحة الإلكترونية eSIM وكل الخدمات شغالة تمام", "service request", "medium", "happy", "satisfied", 0.95, False, "مروة حسن", "01255667788", "Orange Premier 700", "Cairo", "reviewed_and_handled"),
        ("الفاتورة جاية 550 جنيه والمفروض 350 جنيه، أرجو توضيح سبب الزيادة دي فوراً", "billing", "critical", "angry", "angry", -0.85, True, "محمود شريف", "01244556677", "Home DSL 300 GB", "Giza", "needs_followup"),
        ("إزاي أعمل استبدال للشريحة لو الخط واقف؟ والفرع بيقفل الساعة كام؟", "service request", "low", "neutral", "neutral", 0.1, False, "يوسف كمال", "01211223344", "Orange Star", "Mansoura", "unopened"),
        ("لمبة الإنترنت في الراوتر برتقالي وبتفصل كل ربع ساعة في الدقي", "technical", "high", "frustrated", "frustrated", -0.5, False, "أحمد أسامة", "01288997766", "Home DSL 400 GB (100 Mbps)", "Giza", "reviewed_and_handled"),
    ]

    import json
    now = datetime.utcnow()
    for i, (msg, cat, prio, sent, emo, sat_score, esc, c_name, c_phone, c_plan, c_reg, rev_stat) in enumerate(sample_issues, 1):
        created_time = (now - timedelta(days=random.randint(0, 3), hours=random.randint(1, 14))).isoformat()
        ticket_id = f"ORG-HIST-{1000 + i}"
        
        # Build multi-turn sample transcript
        transcript = [
            {"role": "user", "content": f"مرحباً، {msg}", "timestamp": created_time},
            {"role": "assistant", "content": f"أهلاً بك يا أستاذ {c_name}! تم استلام طلبك ومراجعته بخصوص {cat}. نقوم حالياً بالتأكد من خط {c_plan} الخاص بك وسنوافيك بالحل الفوري وفقاً لأعلى معايير جودة أورنج.", "timestamp": created_time}
        ]
        if sent in ["frustrated", "angry"]:
            transcript.append({"role": "user", "content": "ياريت بأسرع وقت لأن الموضوع متكرر معايا ومهم جداً.", "timestamp": created_time})
            transcript.append({"role": "assistant", "content": "مقدرين جداً انزعاجك ونعتذر بشدة عن أي تعطيل. تم رفع الأمر للأولوية القصوى وجارِ المتابعة الفورية.", "timestamp": created_time})

        save_ticket({
            "id": ticket_id,
            "customer_id": f"CUST-100{i % 4 + 1}",
            "customer_name": c_name,
            "customer_email": f"customer{i}@example.com",
            "customer_phone": c_phone,
            "customer_plan": c_plan,
            "region": c_reg,
            "message": msg,
            "category": cat,
            "priority": prio,
            "sentiment": sent,
            "customer_emotion": emo,
            "satisfaction_score": sat_score,
            "status": "escalated" if esc else "resolved",
            "review_status": rev_stat,
            "reviewed_at": created_time if rev_stat != "unopened" else None,
            "reviewer_notes": "تم التواصل مع العميل وحل المشكلة هاتفياً" if rev_stat == "reviewed_and_handled" else ("يتطلب اتصالاً هاتفياً إضافياً من المشرف" if rev_stat == "needs_followup" else ""),
            "reply": f"أهلاً بك يا أستاذ {c_name}! تم اتخاذ الإجراء اللازم بخصوص استفسارك عن {cat}.",
            "session_transcript": json.dumps(transcript, ensure_ascii=False),
            "escalated": esc,
            "escalation_reason": "High customer frustration and regulatory risk" if esc else None,
            "qa_passed": True,
            "qa_retries": 0,
            "latency_ms": round(random.uniform(900.0, 2400.0), 1),
            "created_at": created_time,
            "resolved_at": created_time
        })

    print("✅ All seed data generated successfully!")

if __name__ == "__main__":
    seed_all()
