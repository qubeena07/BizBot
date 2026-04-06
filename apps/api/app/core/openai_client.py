import logging
import google.generativeai as genai
from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)


async def get_embedding(text: str, task_type: str = "retrieval_document") -> list[float]:
    if not settings.gemini_api_key:
        raise RuntimeError("Gemini API key not configured")

    response = genai.embed_content(
        model=settings.gemini_embedding_model,
        content=text,
        task_type=task_type,
        output_dimensionality=768,
    )
    return response["embedding"]


async def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Embed multiple texts in a single API call."""
    if not settings.gemini_api_key:
        raise RuntimeError("Gemini API key not configured")

    response = genai.embed_content(
        model=settings.gemini_embedding_model,
        content=texts,
        task_type="retrieval_document",
        output_dimensionality=768,
    )
    return response["embedding"]


async def get_chat_completion(messages: list[dict], temperature: float = 0.7) -> str:
    if not settings.gemini_api_key:
        raise RuntimeError("Gemini API key not configured")

    # Convert OpenAI-style messages to Gemini format
    system_instruction = None
    gemini_messages = []
    for msg in messages:
        if msg["role"] == "system":
            system_instruction = msg["content"]
        elif msg["role"] == "user":
            gemini_messages.append({"role": "user", "parts": [msg["content"]]})
        elif msg["role"] == "assistant":
            gemini_messages.append({"role": "model", "parts": [msg["content"]]})

    model_kwargs = {
        "generation_config": genai.types.GenerationConfig(temperature=temperature),
    }
    if system_instruction:
        model_kwargs["system_instruction"] = system_instruction

    model = genai.GenerativeModel(settings.gemini_chat_model, **model_kwargs)

    response = model.generate_content(gemini_messages)

    # Handle blocked or empty responses
    if not response.candidates:
        logger.error("Gemini returned no candidates. Prompt feedback: %s", response.prompt_feedback)
        raise RuntimeError(f"Gemini blocked the request: {response.prompt_feedback}")

    candidate = response.candidates[0]
    if candidate.finish_reason and candidate.finish_reason.name == "SAFETY":
        logger.error("Gemini response blocked by safety filters: %s", candidate.safety_ratings)
        raise RuntimeError("Response blocked by safety filters")

    try:
        return response.text or ""
    except ValueError as e:
        logger.error("Failed to extract text from Gemini response: %s", e)
        raise
