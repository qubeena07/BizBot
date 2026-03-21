import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.conversation import Conversation, Message
from app.services.rag_service import RAGService


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.rag = RAGService()

    async def handle_message(
        self,
        tenant_id: str,
        message: str,
        conversation_id: str | None = None,
        visitor_id: str | None = None,
    ) -> dict:
        if conversation_id:
            result = await self.db.execute(
                select(Conversation).where(Conversation.id == conversation_id)
            )
            conversation = result.scalar_one_or_none()
        else:
            conversation = None

        if not conversation:
            conversation = Conversation(
                tenant_id=tenant_id,
                visitor_id=visitor_id or str(uuid.uuid4()),
            )
            self.db.add(conversation)
            await self.db.flush()

        user_msg = Message(
            conversation_id=conversation.id,
            role="user",
            content=message,
        )
        self.db.add(user_msg)

        rag_result = await self.rag.query(tenant_id, message)

        assistant_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=rag_result["response"],
        )
        self.db.add(assistant_msg)
        await self.db.flush()

        return {
            "response": rag_result["response"],
            "conversation_id": str(conversation.id),
            "sources": rag_result["sources"],
        }

    async def list_conversations(self, tenant_id: str) -> list[dict]:
        result = await self.db.execute(
            select(
                Conversation,
                func.count(Message.id).label("message_count"),
            )
            .outerjoin(Message)
            .where(Conversation.tenant_id == tenant_id)
            .group_by(Conversation.id)
            .order_by(Conversation.updated_at.desc())
        )

        conversations = []
        for conv, msg_count in result.all():
            conversations.append({
                "id": str(conv.id),
                "visitor_id": conv.visitor_id,
                "status": conv.status,
                "created_at": conv.created_at,
                "message_count": msg_count,
            })
        return conversations
