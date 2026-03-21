from uuid import UUID
from pydantic import BaseModel, field_serializer


class TenantSettingsResponse(BaseModel):
    id: UUID

    @field_serializer("id")
    def serialize_id(self, v: UUID) -> str:
        return str(v)
    business_name: str
    bot_name: str
    welcome_message: str
    primary_color: str
    widget_position: str
    industry: str | None
    timezone: str

    model_config = {"from_attributes": True}


class TenantSettingsUpdate(BaseModel):
    business_name: str | None = None
    bot_name: str | None = None
    welcome_message: str | None = None
    primary_color: str | None = None
    widget_position: str | None = None
    industry: str | None = None
    timezone: str | None = None


class WidgetConfig(BaseModel):
    primary_color: str
    position: str
    welcome_message: str
    avatar_url: str | None = None


class WidgetConfigResponse(BaseModel):
    config: WidgetConfig
    embed_code: str
    tenant_id: str
