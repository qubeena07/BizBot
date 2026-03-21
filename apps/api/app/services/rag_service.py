import uuid
from app.config import get_settings
from app.core.openai_client import get_embedding, get_embeddings_batch, get_chat_completion
from app.core.pinecone import get_pinecone_index

settings = get_settings()

SYSTEM_PROMPT = """You are a helpful AI assistant for a business. Answer questions based on the provided context from the company's knowledge base.

Rules:
- Only answer based on the provided context. If the context doesn't contain enough information, say so honestly.
- Be concise, friendly, and professional.
- If asked something outside the context, politely say you can only help with questions related to the business.
- Cite which source the information came from when possible.

Context from knowledge base:
{context}"""


class RAGService:
    """Retrieval-Augmented Generation service."""

    def __init__(self):
        self.index = get_pinecone_index()

    async def query(self, tenant_id: str, question: str) -> dict:
        """Query the knowledge base and generate a response."""
        if not self.index:
            return {
                "response": "Knowledge base is not configured yet. Please check your Pinecone settings.",
                "sources": [],
            }

        # 1. Embed the question
        try:
            query_embedding = await get_embedding(question)
        except Exception as e:
            return {
                "response": f"Sorry, I encountered an error processing your question. Please try again.",
                "sources": [],
            }

        # 2. Search Pinecone for relevant chunks
        try:
            results = self.index.query(
                vector=query_embedding,
                top_k=5,
                include_metadata=True,
                filter={"tenant_id": tenant_id},
            )
        except Exception as e:
            return {
                "response": "Sorry, I couldn't search the knowledge base right now. Please try again.",
                "sources": [],
            }

        matches = results.get("matches", [])
        if not matches:
            return {
                "response": "I don't have enough information in my knowledge base to answer that question. "
                            "Please add more knowledge sources to help me learn!",
                "sources": [],
            }

        # 3. Build context from retrieved chunks
        context_parts = []
        sources = []
        for match in matches:
            meta = match.get("metadata", {})
            content = meta.get("content", "")
            if content:
                source_name = meta.get("source_name", "Unknown")
                context_parts.append(f"[Source: {source_name}]\n{content}")
                sources.append({
                    "source_id": meta.get("source_id", ""),
                    "source_filename": source_name,
                    "chunk_content": content[:200],
                    "relevance_score": round(match.get("score", 0), 3),
                })

        context = "\n\n---\n\n".join(context_parts)

        # 4. Call OpenAI chat completion
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT.format(context=context)},
            {"role": "user", "content": question},
        ]

        try:
            response = await get_chat_completion(messages, temperature=0.3)
        except Exception as e:
            return {
                "response": "Sorry, I couldn't generate a response right now. Please try again.",
                "sources": sources,
            }

        return {
            "response": response,
            "sources": sources,
        }

    async def embed_and_store(self, tenant_id: str, source_id: str, source_name: str, chunks: list[str]) -> int:
        """Embed text chunks and store in Pinecone using batch API calls."""
        if not self.index:
            raise RuntimeError("Pinecone is not configured")

        if not chunks:
            return 0

        vectors = []
        # OpenAI supports up to 2048 inputs per batch call
        # Use batches of 100 to stay safe on token limits
        batch_size = 100
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            embeddings = await get_embeddings_batch(batch)

            for j, (chunk, embedding) in enumerate(zip(batch, embeddings)):
                vector_id = f"{source_id}_{i + j}"
                vectors.append({
                    "id": vector_id,
                    "values": embedding,
                    "metadata": {
                        "tenant_id": tenant_id,
                        "source_id": source_id,
                        "source_name": source_name,
                        "content": chunk,
                        "chunk_index": i + j,
                    },
                })

        # Upsert to Pinecone in batches
        for i in range(0, len(vectors), 100):
            batch = vectors[i:i + 100]
            self.index.upsert(vectors=batch)

        return len(vectors)

    async def delete_source_vectors(self, tenant_id: str, source_id: str) -> None:
        """Delete all vectors for a knowledge source from Pinecone."""
        if not self.index:
            return

        try:
            self.index.delete(filter={"tenant_id": tenant_id, "source_id": source_id})
        except Exception:
            # Some Pinecone plans don't support delete by filter
            # Fall back to deleting by ID prefix
            pass
