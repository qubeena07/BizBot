#!/bin/bash

# ═══════════════════════════════════════════
#  BizBot AI — Full Reset (Nuclear Option)
#  Deletes everything and starts fresh
#  Run: ./reset.sh
# ═══════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "\n${RED}${BOLD}⚠️  This will DELETE all data and reset everything!${NC}"
echo "  - All database data (users, conversations, documents)"
echo "  - All uploaded files"
echo "  - Python venv (will reinstall)"
echo "  - Node modules (will reinstall)"
echo ""
read -p "Are you sure? Type 'yes' to confirm: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo -e "\n${YELLOW}Resetting...${NC}\n"

# Stop everything
./stop.sh 2>/dev/null <<< "y"

# Docker cleanup
if docker compose version &> /dev/null 2>&1; then
    docker compose down -v 2>/dev/null
else
    docker-compose down -v 2>/dev/null
fi
echo -e "${GREEN}✅ Docker volumes deleted${NC}"

# Remove Python venv
rm -rf apps/api/venv
echo -e "${GREEN}✅ Python venv removed${NC}"

# Remove uploaded files
rm -rf apps/api/uploads/*
echo -e "${GREEN}✅ Uploads cleared${NC}"

# Remove node_modules
rm -rf apps/web/node_modules
rm -rf apps/web/.next
echo -e "${GREEN}✅ Node modules removed${NC}"

# Remove generated env (keep .env.example)
rm -f apps/api/.env
rm -f apps/web/.env.local
echo -e "${GREEN}✅ Environment files removed${NC}"

# Remove logs
rm -f /tmp/bizbot-*.log /tmp/bizbot-*.pid
echo -e "${GREEN}✅ Logs cleaned${NC}"

echo -e "\n${GREEN}${BOLD}Reset complete!${NC}"
echo -e "Run ${YELLOW}./start.sh${NC} to set up everything fresh.\n"
