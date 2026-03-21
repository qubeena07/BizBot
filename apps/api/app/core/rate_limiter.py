from fastapi import HTTPException, Request, status
from app.core.redis import redis_client


async def rate_limit(request: Request, limit: int = 60, window: int = 60):
    """Simple sliding window rate limiter using Redis."""
    client_ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:{client_ip}:{request.url.path}"

    current = await redis_client.incr(key)
    if current == 1:
        await redis_client.expire(key, window)

    if current > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
        )
