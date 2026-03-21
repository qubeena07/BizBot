#!/bin/bash

# ═══════════════════════════════════════════
#  BizBot AI — Stop All Services
#  Run: ./stop.sh
# ═══════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${YELLOW}🛑 Stopping BizBot AI...${NC}\n"

# Kill backend
if [ -f /tmp/bizbot-api.pid ]; then
    PID=$(cat /tmp/bizbot-api.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID 2>/dev/null
        echo -e "${GREEN}✅ Backend stopped (PID: $PID)${NC}"
    fi
    rm -f /tmp/bizbot-api.pid
fi

# Kill frontend
if [ -f /tmp/bizbot-web.pid ]; then
    PID=$(cat /tmp/bizbot-web.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend stopped (PID: $PID)${NC}"
    fi
    rm -f /tmp/bizbot-web.pid
fi

# Kill anything still on ports 8000 and 3000
for PORT in 8000 3000; do
    PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        echo "$PIDS" | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✅ Killed remaining processes on port $PORT${NC}"
    fi
done

# Ask about Docker
echo ""
read -p "Also stop PostgreSQL + Redis (Docker)? [y/N]: " STOP_DOCKER
if [[ "$STOP_DOCKER" =~ ^[Yy]$ ]]; then
    if docker compose version &> /dev/null 2>&1; then
        docker compose down
    else
        docker-compose down
    fi
    echo -e "${GREEN}✅ Databases stopped${NC}"
else
    echo -e "${YELLOW}ℹ️  Databases still running (saves startup time tomorrow)${NC}"
fi

# Clean logs
rm -f /tmp/bizbot-api.log /tmp/bizbot-web.log

echo -e "\n${GREEN}All stopped. Run ${NC}${YELLOW}./start.sh${NC}${GREEN} to start again.${NC}\n"
