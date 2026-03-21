from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.tenant import Tenant
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, business_name: str, email: str, password: str) -> User:
        existing = await self.db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            raise ValueError("Email already registered")

        tenant = Tenant(business_name=business_name)
        self.db.add(tenant)
        await self.db.flush()

        user = User(
            tenant_id=tenant.id,
            email=email,
            name=business_name,
            hashed_password=hash_password(password),
            role="owner",
        )
        self.db.add(user)
        await self.db.flush()

        return user

    async def login(self, email: str, password: str) -> dict | None:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user or not user.hashed_password:
            return None
        if not verify_password(password, user.hashed_password):
            return None

        access_token = create_access_token({"sub": str(user.id), "tenant_id": str(user.tenant_id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "tenant_id": str(user.tenant_id),
                "role": user.role,
            },
        }
