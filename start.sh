#!/bin/bash

# ═══════════════════════════════════════════════════════════════
#  BizBot AI — Daily Startup Script
#  Uses YOUR existing venv and .env — never recreates them
#  Run every day: ./start.sh
# ═══════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

log()   { echo -e "${GREEN}✅ $1${NC}"; }
warn()  { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()   { echo -e "${RED}❌ $1${NC}"; }
info()  { echo -e "${BLUE}ℹ️  $1${NC}"; }
step()  { echo -e "\n${PURPLE}${BOLD}━━━ $1 ━━━${NC}\n"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "\n${CYAN}${BOLD}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║         🤖 BizBot AI                 ║"
echo "  ║     Development Startup Script       ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}\n"

# ═══════════════════════════════════════════
# PHASE 0: Quick checks
# ═══════════════════════════════════════════
step "Checking prerequisites"

MISSING=0
if command -v docker &> /dev/null && docker info &> /dev/null; then
    log "Docker running"
else
    err "Docker not running! Open Docker Desktop first."; MISSING=1
fi
command -v python3 &>/dev/null && log "Python $(python3 --version 2>&1 | awk '{print $2}')" || { err "Python 3 not found"; MISSING=1; }
command -v node &>/dev/null && log "Node.js $(node --version)" || { err "Node.js not found"; MISSING=1; }
[ $MISSING -eq 1 ] && exit 1

# ═══════════════════════════════════════════
# PHASE 1: Start databases
# ═══════════════════════════════════════════
step "Starting PostgreSQL + Redis"

if docker compose version &>/dev/null 2>&1; then DC="docker compose"; else DC="docker-compose"; fi

$DC up postgres redis -d 2>&1 | tail -3

echo -n "  Waiting for databases"
for i in {1..30}; do
    PG=$($DC ps postgres 2>/dev/null | grep -c "healthy" || echo "0")
    RD=$($DC ps redis 2>/dev/null | grep -c "healthy" || echo "0")
    if [ "$PG" -ge 1 ] && [ "$RD" -ge 1 ]; then
        echo ""; log "PostgreSQL ready (port 5432)"; log "Redis ready (port 6379)"; break
    fi
    echo -n "."; sleep 1
done

# ═══════════════════════════════════════════
# PHASE 2: Activate YOUR existing backend
# ═══════════════════════════════════════════
step "Activating backend (using your existing venv + .env)"

cd "$SCRIPT_DIR/apps/api"

# ── Find and activate YOUR existing venv ──
VENV_FOUND=0
for VDIR in venv .venv env myenv; do
    if [ -d "$VDIR" ]; then
        source "$VDIR/bin/activate"
        log "Activated existing $VDIR/"
        VENV_FOUND=1
        VENV_NAME="$VDIR"
        break
    fi
done

if [ $VENV_FOUND -eq 0 ]; then
    err "No virtual environment found in apps/api/"
    echo "    Looked for: venv/ .venv/ env/ myenv/"
    echo "    Your existing venv folder name might be different."
    echo ""
    read -p "    Enter your venv folder name (or 'create' to make new one): " CUSTOM_VENV
    if [ "$CUSTOM_VENV" = "create" ]; then
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        VENV_NAME="venv"
    elif [ -d "$CUSTOM_VENV" ]; then
        source "$CUSTOM_VENV/bin/activate"
        VENV_NAME="$CUSTOM_VENV"
    else
        err "Folder '$CUSTOM_VENV' not found. Exiting."; exit 1
    fi
fi

# ── Use YOUR existing .env ──
if [ -f ".env" ]; then
    log "Using existing .env"
else
    err "No .env file found in apps/api/"
    echo "    Create one: cp .env.example .env"
    exit 1
fi

# ── Migrations ──
info "Running migrations..."
python3 -m alembic upgrade head 2>&1 | tail -2
log "Database ready"

mkdir -p uploads
cd "$SCRIPT_DIR"

# ═══════════════════════════════════════════
# PHASE 3: Prepare frontend
# ═══════════════════════════════════════════
step "Preparing frontend"

cd "$SCRIPT_DIR/apps/web"

[ -d "node_modules" ] && log "Node modules present" || { info "Installing..."; npm install 2>&1 | tail -3; }

if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/v1
NEXTAUTH_SECRET=bizbot-dev-secret
NEXTAUTH_URL=http://localhost:3000
EOF
    log "Created .env.local"
else
    log "Using existing .env.local"
fi

cd "$SCRIPT_DIR"

# ═══════════════════════════════════════════
# PHASE 4: Start everything
# ═══════════════════════════════════════════
step "Starting services"

# Kill anything on our ports
for PORT in 8000 3000; do
    PID=$(lsof -ti :$PORT 2>/dev/null || true)
    [ -n "$PID" ] && kill -9 $PID 2>/dev/null && sleep 0.5
done

# ── Backend ──
info "Starting FastAPI on port 8000..."
cd "$SCRIPT_DIR/apps/api"
source "$VENV_NAME/bin/activate"
uvicorn app.main:app --reload --port 8000 --host 127.0.0.1 > /tmp/bizbot-api.log 2>&1 &
API_PID=$!
cd "$SCRIPT_DIR"

echo -n "  Waiting for API"
API_READY=0
for i in {1..20}; do
    if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
        echo ""; log "FastAPI running (PID: $API_PID)"; API_READY=1; break
    fi
    echo -n "."; sleep 1
done
[ $API_READY -eq 0 ] && { echo ""; err "Backend failed! Run: tail -50 /tmp/bizbot-api.log"; }

# ── Frontend ──
info "Starting Next.js on port 3000..."
cd "$SCRIPT_DIR/apps/web"
npm run dev > /tmp/bizbot-web.log 2>&1 &
WEB_PID=$!
cd "$SCRIPT_DIR"

echo -n "  Waiting for frontend"
for i in {1..30}; do
    if curl -s http://127.0.0.1:3000 > /dev/null 2>&1; then
        echo ""; log "Next.js running (PID: $WEB_PID)"; break
    fi
    echo -n "."; sleep 1
done

# ═══════════════════════════════════════════
# DONE
# ═══════════════════════════════════════════
echo "$API_PID" > /tmp/bizbot-api.pid
echo "$WEB_PID" > /tmp/bizbot-web.pid

echo ""
echo -e "${GREEN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║           🚀 BizBot AI is running!                  ║"
echo "  ╠══════════════════════════════════════════════════════╣"
echo "  ║                                                      ║"
echo "  ║   Frontend:  http://localhost:3000                   ║"
echo "  ║   Backend:   http://localhost:8000/docs              ║"
echo "  ║                                                      ║"
echo "  ║   Logs:                                              ║"
echo "  ║     tail -f /tmp/bizbot-api.log                      ║"
echo "  ║     tail -f /tmp/bizbot-web.log                      ║"
echo "  ║                                                      ║"
echo "  ║   Stop: Ctrl+C  or  ./stop.sh                       ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    sleep 2 && open "http://localhost:3000" &
elif command -v xdg-open &>/dev/null; then
    sleep 2 && xdg-open "http://localhost:3000" &
fi

# Ctrl+C cleanup
cleanup() {
    echo -e "\n${YELLOW}Shutting down...${NC}"
    kill $API_PID $WEB_PID 2>/dev/null
    rm -f /tmp/bizbot-api.pid /tmp/bizbot-web.pid
    echo -e "${GREEN}Stopped. Databases still running (faster start tomorrow).${NC}"
    echo -e "${GREEN}Stop databases too: $DC down${NC}\n"
    exit 0
}
trap cleanup SIGINT SIGTERM

echo -e "${CYAN}Press Ctrl+C to stop${NC}\n"
wait

# ./start.sh