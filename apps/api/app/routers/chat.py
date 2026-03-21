import json
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.database import get_db, async_session
from app.dependencies import get_current_tenant
from app.models.conversation import Conversation, Message
from app.schemas.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
)
from app.services.chat_service import ChatService

router = APIRouter()


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    request: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)
    return await service.handle_message(
        tenant_id=request.tenant_id,
        message=request.message,
        conversation_id=request.conversation_id,
        visitor_id=request.visitor_id,
    )


@router.websocket("/ws/{tenant_id}")
async def chat_websocket(websocket: WebSocket, tenant_id: str):
    await websocket.accept()
    conversation_id = None

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "detail": "Invalid JSON"})
                continue

            msg_type = data.get("type")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if msg_type != "message":
                continue

            content = data.get("content", "").strip()
            if not content:
                await websocket.send_json({"type": "error", "detail": "Empty message"})
                continue

            conversation_id = data.get("conversation_id") or conversation_id

            try:
                async with async_session() as db:
                    service = ChatService(db)
                    result = await service.handle_message(
                        tenant_id=tenant_id,
                        message=content,
                        conversation_id=conversation_id,
                    )
                    await db.commit()

                conversation_id = result["conversation_id"]

                await websocket.send_json({
                    "type": "chunk",
                    "content": result["response"],
                })

                if result.get("sources"):
                    await websocket.send_json({
                        "type": "sources",
                        "data": result["sources"],
                    })

                await websocket.send_json({
                    "type": "done",
                    "conversation_id": conversation_id,
                })

            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "detail": str(e),
                })

    except WebSocketDisconnect:
        pass


@router.get("/conversations")
async def list_conversations(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    status: str | None = Query(default=None),
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(
            Conversation,
            func.count(Message.id).label("message_count"),
        )
        .outerjoin(Message)
        .where(Conversation.tenant_id == tenant_id)
        .group_by(Conversation.id)
        .order_by(desc(Conversation.updated_at))
    )

    if status:
        query = query.where(Conversation.status == status)

    # Get total count
    count_query = select(func.count(Conversation.id)).where(Conversation.tenant_id == tenant_id)
    if status:
        count_query = count_query.where(Conversation.status == status)
    total = await db.scalar(count_query) or 0

    # Paginate
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)

    conversations = []
    for conv, msg_count in result.all():
        # Get last message preview
        last_msg_result = await db.execute(
            select(Message.content, Message.created_at)
            .where(Message.conversation_id == conv.id)
            .order_by(desc(Message.created_at))
            .limit(1)
        )
        last_msg = last_msg_result.first()

        conversations.append({
            "id": str(conv.id),
            "title": None,
            "visitor_id": conv.visitor_id,
            "status": conv.status,
            "message_count": msg_count,
            "started_at": conv.created_at.isoformat(),
            "last_message_at": last_msg.created_at.isoformat() if last_msg else None,
            "last_message_preview": (last_msg.content[:100] + "..." if len(last_msg.content) > 100 else last_msg.content) if last_msg else None,
        })

    return {"conversations": conversations, "total": total}


@router.get("/conversations/{conversation_id}")
async def get_conversation_detail(
    conversation_id: str,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    # Get conversation
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.tenant_id == tenant_id,
        )
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Get message count
    msg_count = await db.scalar(
        select(func.count(Message.id)).where(Message.conversation_id == conv.id)
    ) or 0

    # Get messages
    msgs_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at)
    )
    messages = [
        {
            "id": str(msg.id),
            "role": msg.role,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
        }
        for msg in msgs_result.scalars().all()
    ]

    return {
        "conversation": {
            "id": str(conv.id),
            "title": None,
            "visitor_id": conv.visitor_id,
            "status": conv.status,
            "message_count": msg_count,
            "started_at": conv.created_at.isoformat(),
        },
        "messages": messages,
    }
