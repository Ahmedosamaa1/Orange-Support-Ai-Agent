import time
from pathlib import Path
from app.config import settings
from app.schemas import ClassificationOutput
from app.services.llm_factory import call_llm_structured

PROMPT_FILE = settings.PROMPTS_DIR / "classifier.txt"

async def run_classifier_agent(message: str) -> ClassificationOutput:
    """Classify incoming telecom customer inquiry into category, priority, sentiment, and language."""
    if PROMPT_FILE.exists():
        system_prompt = PROMPT_FILE.read_text(encoding="utf-8")
    else:
        system_prompt = "You are the Orange Telecom Classifier Agent. Analyze the message."

    user_prompt = f"{system_prompt}\n\nCustomer Support Message:\n\"\"\"{message}\"\"\""
    
    result = await call_llm_structured(
        prompt=user_prompt,
        schema=ClassificationOutput,
        agent_type="classifier",
        context={"message": message}
    )
    return result
