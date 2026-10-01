import json
import time
import asyncio
from pathlib import Path
from typing import Dict, Any, List

# Ensure parent directory is in path
import sys
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "backend"))

from app.graph.workflow import run_pipeline_streaming
from app.services.rag_service import rag_service
from app.services.sheets_service import sheets_service

import os
is_mock = os.getenv("MOCK_LLM", "false").lower() in ("true", "1")
output_filename = "eval_results.json" if is_mock else "eval_results_live.json"

DATASET_FILE = Path(__file__).resolve().parent / "test_dataset.json"
RESULTS_FILE = Path(__file__).resolve().parent / output_filename

async def evaluate_dataset() -> Dict[str, Any]:
    """Run full evaluation over test dataset and return structured report."""
    rag_service.index_documents()
    sheets_service.seed_default_data()

    with open(DATASET_FILE, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    total = len(dataset)
    correct_category = 0
    correct_escalation = 0
    qa_passed_count = 0
    total_latency_ms = 0.0
    total_retries = 0
    failures = 0
    item_results = []

    mode_label = "OFFLINE MOCK BASELINE" if is_mock else "LIVE GEMINI API"
    print(f"\n==================================================")
    print(f"🚀 Running Orange Multi-Agent Evaluation ({total} Cases) [{mode_label}]")
    print(f"📁 Target Output File: {RESULTS_FILE.name}")
    print(f"==================================================")

    for item in dataset:
        test_id = item["id"]
        msg = item["message"]
        exp_cat = item["expected_category"]
        exp_esc = item["expected_escalation"]

        if not is_mock and item != dataset[0]:
            await asyncio.sleep(2.5)

        t0 = time.time()
        final_state = None
        pipeline_events = []

        try:
            async for event in run_pipeline_streaming(
                message=msg,
                customer_id=item.get("customer_id", "CUST-1001"),
                customer_name=item.get("customer_name", "Customer"),
                customer_email=f"{item.get('customer_id', 'cust').lower()}@example.com",
                customer_phone=item.get("customer_phone", "01200000000"),
                customer_plan=item.get("customer_plan", "Home DSL 140 GB"),
                region=item.get("region", "Cairo")
            ):
                pipeline_events.append(event)
                if event.get("event") == "pipeline_complete":
                    final_state = event.get("final_state")

            latency = round((time.time() - t0) * 1000, 1)
            total_latency_ms += latency

            if not final_state:
                failures += 1
                continue

            cls_data = final_state.get("classification", {})
            qa_data = final_state.get("qa", {})
            act_data = final_state.get("actions", {})
            retries = final_state.get("qa_retries", 0)
            total_retries += retries

            pred_cat = cls_data.get("category", "")
            pred_esc = act_data.get("escalated", False)
            passed_qa = qa_data.get("passed", True)

            cat_match = (pred_cat.lower() == exp_cat.lower())
            esc_match = (pred_esc == exp_esc)

            if cat_match:
                correct_category += 1
            if esc_match:
                correct_escalation += 1
            if passed_qa:
                qa_passed_count += 1

            item_results.append({
                "id": test_id,
                "customer_id": item.get("customer_id", "CUST-1001"),
                "customer_name": item.get("customer_name", "Customer"),
                "region": item.get("region", "Cairo"),
                "language": item.get("language"),
                "expected_category": exp_cat,
                "predicted_category": pred_cat,
                "category_match": cat_match,
                "expected_escalation": exp_esc,
                "predicted_escalation": pred_esc,
                "escalation_match": esc_match,
                "qa_passed": passed_qa,
                "qa_retries": retries,
                "latency_ms": latency
            })

            status_icon = "✅" if (cat_match and esc_match and passed_qa) else "⚠️"
            print(f"{status_icon} [{test_id}] Cat: {pred_cat} ({'✓' if cat_match else '✗'}) | Esc: {pred_esc} ({'✓' if esc_match else '✗'}) | QA: {passed_qa} | {latency}ms")

        except Exception as e:
            failures += 1
            print(f"❌ [{test_id}] Failed with exception: {e}")
            item_results.append({
                "id": test_id,
                "error": str(e),
                "category_match": False,
                "escalation_match": False,
                "qa_passed": False
            })

    # Summary Metrics Calculation
    cat_accuracy = round((correct_category / total) * 100, 1) if total else 0.0
    esc_accuracy = round((correct_escalation / total) * 100, 1) if total else 0.0
    qa_rate = round((qa_passed_count / total) * 100, 1) if total else 0.0
    avg_latency = round(total_latency_ms / total, 1) if total else 0.0
    avg_retries = round(total_retries / total, 2) if total else 0.0
    failure_rate = round((failures / total) * 100, 1) if total else 0.0

    summary = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_tests": total,
        "metrics": {
            "classification_accuracy": cat_accuracy,
            "escalation_accuracy": esc_accuracy,
            "qa_pass_rate": qa_rate,
            "avg_latency_ms": avg_latency,
            "avg_retries_per_ticket": avg_retries,
            "failure_rate": failure_rate
        },
        "item_results": item_results
    }

    # Save to JSON
    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    # Print Markdown Table
    print("\n" + "=" * 60)
    print("📈 EVALUATION BENCHMARK SUMMARY")
    print("=" * 60)
    print(f"| Metric                      | Result     | Target Benchmark |")
    print(f"|-----------------------------|------------|------------------|")
    print(f"| Classification Accuracy     | {cat_accuracy}%     | >= 90.0%         |")
    print(f"| Escalation Accuracy         | {esc_accuracy}%     | >= 85.0%         |")
    print(f"| QA Verification Pass Rate   | {qa_rate}%     | >= 95.0%         |")
    print(f"| Average Latency per Ticket  | {avg_latency} ms | < 2500 ms        |")
    print(f"| Average Retries per Ticket  | {avg_retries}      | < 0.25           |")
    print(f"| Pipeline Failure Rate       | {failure_rate}%       | 0.0%             |")
    print("=" * 60)

    return summary

if __name__ == "__main__":
    asyncio.run(evaluate_dataset())
