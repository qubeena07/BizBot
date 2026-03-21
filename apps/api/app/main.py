from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import ResponseValidationError
from app.config import get_settings
from app.routers import auth, knowledge, chat, tenant, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    settings = get_settings()
    print(f"Starting BizBot AI API — CORS origins: {settings.cors_origins}")
    yield
    # Shutdown
    print("Shutting down BizBot AI API")


app = FastAPI(
    title="BizBot AI API",
    description="Multi-tenant AI receptionist backend",
    version="0.1.0",
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ResponseValidationError)
async def response_validation_handler(request: Request, exc: ResponseValidationError):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(knowledge.router, prefix="/api/v1/knowledge", tags=["knowledge"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(tenant.router, prefix="/api/v1/tenant", tags=["tenant"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "bizbot-ai-api"}
