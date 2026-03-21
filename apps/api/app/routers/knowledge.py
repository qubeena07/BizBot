from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user, get_current_tenant
from app.models.user import User
from app.schemas.knowledge import (
    SourcesListResponse,
    UploadResponse,
    TextSourceRequest,
    UrlSourceRequest,
)
from app.services.knowledge_service import KnowledgeService, process_source_background

router = APIRouter()


def _source_to_response(source) -> dict:
    """Convert a KnowledgeSource model to the frontend-expected shape."""
    return {
        "id": source.id,
        "filename": source.original_filename or source.name,
        "original_filename": source.original_filename or source.name,
        "file_type": source.file_type or source.type,
        "file_size": source.file_size or 0,
        "status": source.status,
        "error_message": source.error_message,
        "chunk_count": source.chunk_count,
        "total_tokens": 0,
        "created_at": source.created_at,
        "updated_at": source.updated_at or source.created_at,
    }


@router.get("/sources", response_model=SourcesListResponse)
async def list_sources(
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    service = KnowledgeService(db)
    sources = await service.list_sources(tenant_id)
    return {
        "sources": [_source_to_response(s) for s in sources],
        "total": len(sources),
    }


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tenant_id = str(current_user.tenant_id)
    service = KnowledgeService(db)
    source = await service.save_file(tenant_id, file)

    # Process in background — returns to user immediately
    background_tasks.add_task(process_source_background, str(source.id), tenant_id)

    return {
        "source_id": str(source.id),
        "filename": source.original_filename or source.name,
        "file_type": source.file_type or source.type,
        "file_size": source.file_size or 0,
        "status": source.status,
        "chunk_count": source.chunk_count,
    }


@router.post("/text", response_model=UploadResponse)
async def add_text(
    background_tasks: BackgroundTasks,
    request: TextSourceRequest,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    service = KnowledgeService(db)
    source = await service.save_text(tenant_id, request.name, request.content)

    background_tasks.add_task(process_source_background, str(source.id), tenant_id)

    return {
        "source_id": str(source.id),
        "filename": source.name,
        "file_type": "text",
        "file_size": len(request.content.encode()),
        "status": source.status,
        "chunk_count": source.chunk_count,
    }


@router.post("/url", response_model=UploadResponse)
async def add_url(
    request: UrlSourceRequest,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    service = KnowledgeService(db)
    source = await service.save_url(tenant_id, request.name, request.url)
    return {
        "source_id": str(source.id),
        "filename": source.name,
        "file_type": "url",
        "file_size": 0,
        "status": source.status,
        "chunk_count": source.chunk_count,
    }


@router.delete("/sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_source(
    source_id: str,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    service = KnowledgeService(db)
    deleted = await service.delete_source(tenant_id, source_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
