import uuid
import os
import asyncio
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from fastapi import UploadFile
from app.models.knowledge import KnowledgeSource
from app.utils.text_splitter import split_text
from app.utils.document_processor import extract_text_from_file
from app.services.rag_service import RAGService
from app.database import async_session

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"


class KnowledgeService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.rag = RAGService()

    async def list_sources(self, tenant_id: str) -> list[KnowledgeSource]:
        result = await self.db.execute(
            select(KnowledgeSource)
            .where(KnowledgeSource.tenant_id == tenant_id)
            .order_by(KnowledgeSource.created_at.desc())
        )
        return list(result.scalars().all())

    async def save_file(self, tenant_id: str, file: UploadFile) -> KnowledgeSource:
        """Save file to disk and create DB record. Returns immediately."""
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        original_name = file.filename or "Uploaded file"
        file_ext = Path(original_name).suffix.lower()
        saved_name = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / saved_name

        content = await file.read()
        file_path.write_bytes(content)

        source = KnowledgeSource(
            tenant_id=tenant_id,
            name=original_name,
            original_filename=original_name,
            file_type=file_ext.lstrip(".") or "unknown",
            file_size=len(content),
            type="file",
            file_path=str(file_path),
            status="processing",
        )
        self.db.add(source)
        await self.db.commit()
        await self.db.refresh(source)
        return source

    async def save_text(self, tenant_id: str, name: str, content: str) -> KnowledgeSource:
        """Save text source to DB. Returns immediately."""
        source = KnowledgeSource(
            tenant_id=tenant_id,
            name=name,
            original_filename=name,
            file_type="txt",
            file_size=len(content.encode()),
            type="text",
            content=content,
            status="processing",
        )
        self.db.add(source)
        await self.db.commit()
        await self.db.refresh(source)
        return source

    async def save_url(self, tenant_id: str, name: str, url: str) -> KnowledgeSource:
        source = KnowledgeSource(
            tenant_id=tenant_id,
            name=name,
            original_filename=name,
            file_type="url",
            type="url",
            url=url,
            status="error",
            error_message="URL crawling not yet implemented. Please upload a file or add text directly.",
        )
        self.db.add(source)
        await self.db.commit()
        await self.db.refresh(source)
        return source

    async def delete_source(self, tenant_id: str, source_id: str) -> bool:
        result = await self.db.execute(
            select(KnowledgeSource).where(
                KnowledgeSource.id == source_id,
                KnowledgeSource.tenant_id == tenant_id,
            )
        )
        source = result.scalar_one_or_none()
        if not source:
            return False

        try:
            await self.rag.delete_source_vectors(tenant_id, source_id)
        except Exception:
            pass

        if source.file_path:
            try:
                os.remove(source.file_path)
            except OSError:
                pass

        await self.db.execute(
            delete(KnowledgeSource).where(
                KnowledgeSource.id == source_id,
                KnowledgeSource.tenant_id == tenant_id,
            )
        )
        return True


async def process_source_background(source_id: str, tenant_id: str) -> None:
    """Background task: extract text, chunk, embed, store vectors.

    Uses its own DB session since the request session is closed by the time this runs.
    """
    rag = RAGService()

    async with async_session() as db:
        try:
            result = await db.execute(
                select(KnowledgeSource).where(KnowledgeSource.id == source_id)
            )
            source = result.scalar_one_or_none()
            if not source:
                return

            # 1. Extract text
            if source.type == "file" and source.file_path:
                text = await extract_text_from_file(source.file_path)
            elif source.type == "text" and source.content:
                text = source.content
            else:
                raise ValueError("No content to process")

            if not text.strip():
                raise ValueError("Extracted text is empty")

            # 2. Split into chunks
            chunks = split_text(text, chunk_size=1000, chunk_overlap=200)
            if not chunks:
                raise ValueError("No chunks generated from text")

            # 3. Embed and store in Pinecone (uses batch API — fast)
            chunk_count = await rag.embed_and_store(
                tenant_id=tenant_id,
                source_id=str(source.id),
                source_name=source.name,
                chunks=chunks,
            )

            # 4. Update status to ready
            source.chunk_count = chunk_count
            source.status = "ready"
            await db.commit()

        except Exception as e:
            source.status = "error"
            source.error_message = str(e)[:500]
            await db.commit()
