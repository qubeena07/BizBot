# BizBot AI

A multi-tenant AI receptionist platform that lets businesses embed a smart chat widget on their website. Each business (tenant) uploads their own knowledge base, and the AI answers customer questions using that data.

---

## What it does

- Businesses sign up, configure their chatbot, and upload documents (FAQs, product info, policies)
- The AI uses RAG (Retrieval-Augmented Generation) to answer questions from that knowledge base
- A single `<script>` tag embeds the chat widget on any website
- Dashboard provides analytics, conversation history, and lead tracking

```html
<script src="https://cdn.bizbot.ai/widget.js"
        data-tenant-id="YOUR_TENANT_ID"></script>
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python), async SQLAlchemy |
| AI | Google Gemini 2.5 Flash (chat) + Gemini Embeddings |
| Vector DB | Pinecone |
| Database | PostgreSQL 16 |
| Cache / Rate limit | Redis 7 |
| Monorepo | Turborepo |
| Containers | Docker + Docker Compose |

---

## Project Structure

```
bizbot-ai/
├── apps/
│   ├── api/                  # FastAPI backend
│   │   ├── app/
│   │   │   ├── routers/      # auth, chat, knowledge, tenant, analytics
│   │   │   ├── services/     # business logic (chat, RAG, knowledge, auth)
│   │   │   ├── models/       # SQLAlchemy models (tenant, user, conversation, lead)
│   │   │   ├── schemas/      # Pydantic request/response schemas
│   │   │   ├── core/         # Redis, Pinecone, OpenAI client, security
│   │   │   └── utils/        # text splitter, document processor
│   │   └── alembic/          # database migrations
│   └── web/                  # Next.js frontend
│       └── src/
│           ├── app/          # pages (dashboard, playground, knowledge, analytics)
│           ├── components/   # UI components
│           ├── hooks/        # data fetching hooks
│           └── stores/       # Zustand state stores
└── packages/
    └── shared/               # shared TypeScript types and constants
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/v1/auth/register` | Register new tenant |
| POST | `/api/v1/auth/login` | Login |
| GET/PUT | `/api/v1/tenant/` | Get/update tenant settings |
| POST | `/api/v1/knowledge/upload` | Upload knowledge document |
| GET | `/api/v1/knowledge/sources` | List knowledge sources |
| POST | `/api/v1/chat/` | Send chat message (widget) |
| GET | `/api/v1/conversations/` | List conversations |
| GET | `/api/v1/analytics/` | Get analytics data |

Full interactive docs at **http://localhost:8000/docs** when running locally.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL + Redis)
- Python 3.11+
- Node.js 18+
- A Google Gemini API key
- A Pinecone account + API key

---

## Local Development

### 1. Clone the repo

```bash
git clone <repo-url>
cd bizbot-ai
```

### 2. Set up backend environment

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` and fill in:

```env
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=bizbot-knowledge
JWT_SECRET_KEY=your_random_secret_key
```

### 3. Create Python virtual environment

```bash
cd apps/api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ../..
```

### 4. Start everything

```bash
./start.sh
```

This script will:
- Start PostgreSQL and Redis via Docker
- Run database migrations
- Start the FastAPI backend on port 8000
- Start the Next.js frontend on port 3000
- Open the browser automatically

### 5. Open the app

| URL | Description |
|---|---|
| http://localhost:3000 | Frontend dashboard |
| http://localhost:8000/docs | API documentation (Swagger) |
| http://localhost:8000/health | API health check |

### Stop

Press `Ctrl+C` in the terminal running `start.sh`.

To also stop the databases:
```bash
docker compose down
```

---

## Embedding the Widget

After a tenant registers, they get an embed snippet to paste into any website's `<body>`:

```html
<script src="https://cdn.bizbot.ai/widget.js"
        data-tenant-id="YOUR_TENANT_ID"></script>
```

The widget loads a chat interface in the bottom-right corner of the page. Conversations are tied to the tenant's knowledge base and logged in their dashboard.

---

## Deployment (Free Tier)

| Service | Provider | Notes |
|---|---|---|
| Frontend + widget.js | [Vercel](https://vercel.com) | Free, auto-deploy from git |
| FastAPI backend | [Railway](https://railway.app) | 500 hrs/month free |
| PostgreSQL | [Railway](https://railway.app) or [Supabase](https://supabase.com) | 500 MB free |
| Redis | [Upstash](https://upstash.com) | 10k requests/day free |
| Vector DB | [Pinecone](https://pinecone.io) | Free starter index |

---

## Logs

```bash
tail -f /tmp/bizbot-api.log   # backend logs
tail -f /tmp/bizbot-web.log   # frontend logs
```
