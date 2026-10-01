from pathlib import Path
from app.config import settings
from app.schemas import SentimentRiskOutput
from app.services.llm_factory import call_llm_structured

PROMPT_FILE = settings.PROMPTS_DIR / "sentiment_risk.txt"

async def run_sentiment_risk_agent(message: str, category: str = "technical") -> SentimentRiskOutput:
    """Analyze customer sentiment, churn risk, and supervisor escalation necessity."""
    if PROMPT_FILE.exists():
        system_prompt = PROMPT_FILE.read_text(encoding="utf-8")
    else:
        system_prompt = "You are the Orange Telecom Sentiment and Risk Agent. Evaluate churn risk."

    user_prompt = f"{system_prompt}\n\nCustomer Inquiry Category: {category}\nCustomer Message:\n\"\"\"{message}\"\"\""
    
    result = await call_llm_structured(
        prompt=user_prompt,
        schema=SentimentRiskOutput,
        agent_type="sentiment_risk",
        context={"message": message, "category": category}
    )
    return result
