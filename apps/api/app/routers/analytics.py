from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_tenant
from app.schemas.analytics import AnalyticsOverview, DailyMetric, AnalyticsChartResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/overview", response_model=AnalyticsOverview)
async def get_overview(
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    return await service.get_overview(tenant_id)


@router.get("/chart", response_model=AnalyticsChartResponse)
async def get_chart(
    metric: str = Query(default="conversations"),
    period: str = Query(default="7d"),
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    return await service.get_chart(tenant_id, metric, period)


@router.get("/daily", response_model=list[DailyMetric])
async def get_daily_metrics(
    days: int = 30,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    return await service.get_daily_metrics(tenant_id, days)
