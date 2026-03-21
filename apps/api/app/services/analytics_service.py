from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.conversation import Conversation, Message
from app.models.lead import Lead


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_overview(self, tenant_id: str) -> dict:
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

        total_convs = await self.db.scalar(
            select(func.count(Conversation.id)).where(Conversation.tenant_id == tenant_id)
        )
        total_msgs = await self.db.scalar(
            select(func.count(Message.id))
            .join(Conversation)
            .where(Conversation.tenant_id == tenant_id)
        )
        leads = await self.db.scalar(
            select(func.count(Lead.id)).where(Lead.tenant_id == tenant_id)
        )
        convs_today = await self.db.scalar(
            select(func.count(Conversation.id)).where(
                Conversation.tenant_id == tenant_id,
                Conversation.created_at >= today,
            )
        )

        return {
            "total_conversations": total_convs or 0,
            "total_messages": total_msgs or 0,
            "leads_captured": leads or 0,
            "avg_satisfaction": 0.0,
            "conversations_today": convs_today or 0,
        }

    async def get_chart(self, tenant_id: str, metric: str = "conversations", period: str = "7d") -> dict:
        days_map = {"7d": 7, "30d": 30, "90d": 90}
        days = days_map.get(period, 7)
        start_date = datetime.now(timezone.utc) - timedelta(days=days)

        if metric == "messages":
            result = await self.db.execute(
                select(
                    func.date(Message.created_at).label("date"),
                    func.count(Message.id).label("value"),
                )
                .join(Conversation)
                .where(
                    Conversation.tenant_id == tenant_id,
                    Message.created_at >= start_date,
                )
                .group_by(func.date(Message.created_at))
                .order_by(func.date(Message.created_at))
            )
        else:
            result = await self.db.execute(
                select(
                    func.date(Conversation.created_at).label("date"),
                    func.count(Conversation.id).label("value"),
                )
                .where(
                    Conversation.tenant_id == tenant_id,
                    Conversation.created_at >= start_date,
                )
                .group_by(func.date(Conversation.created_at))
                .order_by(func.date(Conversation.created_at))
            )

        data = [{"date": str(row.date), "value": row.value} for row in result.all()]
        total = sum(point["value"] for point in data)
        return {"data": data, "metric": metric, "period": period, "total": total}

    async def get_daily_metrics(self, tenant_id: str, days: int = 30) -> list[dict]:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        result = await self.db.execute(
            select(
                func.date(Conversation.created_at).label("date"),
                func.count(Conversation.id).label("conversations"),
            )
            .where(
                Conversation.tenant_id == tenant_id,
                Conversation.created_at >= start_date,
            )
            .group_by(func.date(Conversation.created_at))
            .order_by(func.date(Conversation.created_at))
        )

        metrics = []
        for row in result.all():
            metrics.append({
                "date": str(row.date),
                "conversations": row.conversations,
                "messages": 0,
            })
        return metrics
