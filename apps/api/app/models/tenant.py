import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    business_name: Mapped[str] = mapped_column(String(255))
    bot_name: Mapped[str] = mapped_column(String(100), default="AI Assistant")
    welcome_message: Mapped[str] = mapped_column(
        String(500), default="Hello! How can I help you today?"
    )
    primary_color: Mapped[str] = mapped_column(String(7), default="#2563eb")
    widget_position: Mapped[str] = mapped_column(String(20), default="bottom-right")
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC")
    plan: Mapped[str] = mapped_column(String(20), default="free")
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    users: Mapped[list["User"]] = relationship(back_populates="tenant")  # noqa: F821
    knowledge_sources: Mapped[list["KnowledgeSource"]] = relationship(  # noqa: F821
        back_populates="tenant"
    )
    conversations: Mapped[list["Conversation"]] = relationship(  # noqa: F821
        back_populates="tenant"
    )
