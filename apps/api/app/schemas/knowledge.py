from uuid import UUID
from pydantic import BaseModel, field_serializer
from datetime import datetime


class KnowledgeSourceResponse(BaseModel):
    id: UUID
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    status: str
    error_message: str | None = None
    chunk_count: int = 0
    total_tokens: int = 0
    created_at: datetime
    updated_at: datetime

    @field_serializer("id")
    def serialize_id(self, v: UUID) -> str:
        return str(v)

    model_config = {"from_attributes": True}


class SourcesListResponse(BaseModel):
    sources: list[KnowledgeSourceResponse]
    total: int


class UploadResponse(BaseModel):
    source_id: str
    filename: str
    file_type: str
    file_size: int
    status: str
    chunk_count: int


class TextSourceRequest(BaseModel):
    name: str
    content: str


class UrlSourceRequest(BaseModel):
    name: str
    url: str
