from pathlib import Path
from app.config import settings
from app.schemas import QAOutput, ResponseOutput, RetrievalOutput, ClassificationOutput
from app.services.llm_factory import call_llm_structured

PROMPT_FILE = settings.PROMPTS_DIR / "qa.txt"

async def run_qa_agent(
    proposed_response: ResponseOutput,
    customer_message: str,
    classification: ClassificationOutput,
    retrieval: RetrievalOutput
) -> QAOutput:
    """Verify factual accuracy, tone, brand safety, and false promise absence."""
    if PROMPT_FILE.exists():
        system_prompt = PROMPT_FILE.read_text(encoding="utf-8")
    else:
        system_prompt = "You are the Orange QA Agent. Audit the proposed customer response."

    user_prompt = f"""{system_prompt}

Customer Inquiry: "{customer_message}"
Customer Language: {classification.language}

Verified Retrieved Knowledge & SLAs:
{retrieval.rag_context}

Proposed Response to Audit:
"{proposed_response.reply_text}"

Suggested Next Steps: {proposed_response.suggested_actions}
"""

    result = await call_llm_structured(
        prompt=user_prompt,
        schema=QAOutput,
        agent_type="qa",
        context={"message": customer_message, "reply": proposed_response.reply_text}
    )
    return result
