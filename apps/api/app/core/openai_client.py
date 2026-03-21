from openai import AsyncOpenAI
from app.config import get_settings

settings = get_settings()

openai_client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None


async def get_embedding(text: str) -> list[float]:
    if not openai_client:
        raise RuntimeError("OpenAI API key not configured")

    response = await openai_client.embeddings.create(
        model=settings.openai_embedding_model,
        input=text,
    )
    return response.data[0].embedding


async def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Embed multiple texts in a single API call (up to 2048 inputs)."""
    if not openai_client:
        raise RuntimeError("OpenAI API key not configured")

    response = await openai_client.embeddings.create(
        model=settings.openai_embedding_model,
        input=texts,
    )
    # Sort by index to ensure correct ordering
    sorted_data = sorted(response.data, key=lambda x: x.index)
    return [item.embedding for item in sorted_data]


async def get_chat_completion(messages: list[dict], temperature: float = 0.7) -> str:
    if not openai_client:
        raise RuntimeError("OpenAI API key not configured")

    response = await openai_client.chat.completions.create(
        model=settings.openai_chat_model,
        messages=messages,
        temperature=temperature,
    )
    return response.choices[0].message.content or ""
