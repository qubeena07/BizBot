from pydantic import BaseModel


class AnalyticsOverview(BaseModel):
    total_conversations: int = 0
    total_messages: int = 0
    leads_captured: int = 0
    avg_satisfaction: float = 0.0
    conversations_today: int = 0


class DailyMetric(BaseModel):
    date: str
    conversations: int
    messages: int


class ChartDataPoint(BaseModel):
    date: str
    value: int


class AnalyticsChartResponse(BaseModel):
    data: list[ChartDataPoint] = []
    metric: str
    period: str
    total: int = 0
