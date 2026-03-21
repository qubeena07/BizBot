from functools import lru_cache
from pinecone import Pinecone
from app.config import get_settings

settings = get_settings()


@lru_cache
def get_pinecone_index():
    if not settings.pinecone_api_key:
        return None

    try:
        pc = Pinecone(api_key=settings.pinecone_api_key)
        return pc.Index(settings.pinecone_index_name)
    except Exception:
        return None
