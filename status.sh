#!/bin/bash

# ═══════════════════════════════════════════
#  BizBot AI — Status Check
#  Run: ./status.sh
# ═══════════════════════════════════════════

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "\n${CYAN}${BOLD}  BizBot AI — Service Status${NC}\n"

# Check Docker
if docker compose version &> /dev/null 2>&1; then
    DC="docker compose"
else
    DC="docker-compose"
fi

# PostgreSQL
if $DC ps postgres 2>/dev/null | grep -q "healthy"; then
    echo -e "  PostgreSQL   ${GREEN}● Running${NC}  (port 5432)"
elif $DC ps postgres 2>/dev/null | grep -q "Up"; then
    echo -e "  PostgreSQL   ${YELLOW}● Starting${NC} (port 5432)"
else
    echo -e "  PostgreSQL   ${RED}● Stopped${NC}"
fi

# Redis
if $DC ps redis 2>/dev/null | grep -q "healthy"; then
    echo -e "  Redis        ${GREEN}● Running${NC}  (port 6379)"
elif $DC ps redis 2>/dev/null | grep -q "Up"; then
    echo -e "  Redis        ${YELLOW}● Starting${NC} (port 6379)"
else
    echo -e "  Redis        ${RED}● Stopped${NC}"
fi

# Backend
if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://127.0.0.1:8000/health)
    echo -e "  FastAPI      ${GREEN}● Running${NC}  (port 8000)  → http://localhost:8000/docs"
else
    echo -e "  FastAPI      ${RED}● Stopped${NC}"
fi

# Frontend
if curl -s http://127.0.0.1:3000 > /dev/null 2>&1; then
    echo -e "  Next.js      ${GREEN}● Running${NC}  (port 3000)  → http://localhost:3000"
else
    echo -e "  Next.js      ${RED}● Stopped${NC}"
fi

# .env check
echo ""
if [ -f "apps/api/.env" ]; then
    source apps/api/.env 2>/dev/null
    if [ "$OPENAI_API_KEY" != "sk-your-openai-key-here" ] && [ -n "$OPENAI_API_KEY" ]; then
        echo -e "  OpenAI Key   ${GREEN}● Configured${NC}"
    else
        echo -e "  OpenAI Key   ${RED}● Not set${NC}  → Edit apps/api/.env"
    fi
    if [ "$PINECONE_API_KEY" != "your-pinecone-api-key" ] && [ -n "$PINECONE_API_KEY" ]; then
        echo -e "  Pinecone Key ${GREEN}● Configured${NC}"
    else
        echo -e "  Pinecone Key ${RED}● Not set${NC}  → Edit apps/api/.env"
    fi
else
    echo -e "  .env file    ${RED}● Missing${NC}   → Run ./start.sh to create"
fi

# Database tables
echo ""
TABLE_COUNT=$(docker exec bizbot-postgres psql -U bizbot -d bizbot -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null || echo "0")
if [ "$TABLE_COUNT" -ge 7 ] 2>/dev/null; then
    echo -e "  DB Tables    ${GREEN}● $TABLE_COUNT tables created${NC}"
else
    echo -e "  DB Tables    ${YELLOW}● $TABLE_COUNT tables${NC} (need 7 — run migrations)"
fi

echo ""
