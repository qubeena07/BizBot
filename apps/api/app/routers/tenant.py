from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_tenant
from app.schemas.tenant import TenantSettingsResponse, TenantSettingsUpdate, WidgetConfigResponse
from app.models.tenant import Tenant
from sqlalchemy import select

router = APIRouter()


@router.get("/settings", response_model=TenantSettingsResponse)
async def get_settings(
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one()
    return tenant


@router.put("/settings", response_model=TenantSettingsResponse)
async def update_settings(
    updates: TenantSettingsUpdate,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one()

    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tenant, field, value)

    await db.flush()
    return tenant


@router.get("/widget-config", response_model=WidgetConfigResponse)
async def get_widget_config(
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one()

    embed_code = (
        f'<script src="https://cdn.bizbot.ai/widget.js" '
        f'data-tenant-id="{tenant_id}"></script>'
    )

    return {
        "config": {
            "primary_color": tenant.primary_color,
            "position": tenant.widget_position,
            "welcome_message": tenant.welcome_message,
            "avatar_url": None,
        },
        "embed_code": embed_code,
        "tenant_id": str(tenant_id),
    }


@router.put("/widget-config", response_model=WidgetConfigResponse)
async def update_widget_config(
    updates: dict,
    tenant_id: str = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one()

    field_map = {
        "primary_color": "primary_color",
        "position": "widget_position",
        "welcome_message": "welcome_message",
    }
    for key, attr in field_map.items():
        if key in updates:
            setattr(tenant, attr, updates[key])

    await db.flush()

    embed_code = (
        f'<script src="https://cdn.bizbot.ai/widget.js" '
        f'data-tenant-id="{tenant_id}"></script>'
    )

    return {
        "config": {
            "primary_color": tenant.primary_color,
            "position": tenant.widget_position,
            "welcome_message": tenant.welcome_message,
            "avatar_url": None,
        },
        "embed_code": embed_code,
        "tenant_id": str(tenant_id),
    }
