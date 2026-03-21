from uuid import UUID
from pydantic import BaseModel, field_serializer
from datetime import datetime


class ChatMessageRequest(BaseModel):
    message: str
    tenant_id: str
    conversation_id: str | None = None
    visitor_id: str | None = None


class ChatMessageResponse(BaseModel):
    response: str
    conversation_id: str
    sources: list[str] = []


class MessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    created_at: datetime

    @field_serializer("id")
    def serialize_id(self, v: UUID) -> str:
        return str(v)

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: UUID
    visitor_id: str
    status: str
    created_at: datetime
    message_count: int = 0

    @field_serializer("id")
    def serialize_id(self, v: UUID) -> str:
        return str(v)

    model_config = {"from_attributes": True}
