# AutoDev - Collaborative Agentic Platform

**Team Name:** Binary Pheonix  
**Team ID:** Auto-250366  
**Competition:** Techfest 2025–26

---

## What is AutoDev?

AutoDev is a multi-agent development automation platform that transforms how software gets built. Instead of manually parsing requirements, writing boilerplate, creating tests, and deploying code, AutoDev handles the entire pipeline autonomously.

You connect your GitHub repository or submit user stories, and the system takes over—breaking down requirements into tasks, generating production-ready code, running automated reviews, creating comprehensive tests, and preparing everything for deployment.

The goal is straightforward: let developers focus on architecture and creative problem-solving while AI handles the repetitive work.

---

## Quick Start

### Prerequisites

Before getting started, make sure you have these installed:

- **Bun** (v1.0+) - [install here](https://bun.sh)
- **Node.js** (v18+) - for compatibility
- **PostgreSQL** (v15+) - or use Docker
- **Redis** (v7+) - for event bus
- **Docker** - for sandbox execution
- **Git** - for version control

### Environment Setup

1. Clone the repository:

```bash
git clone https://github.com/akshatarora130/AutoDev.git
cd AutoDev
```

2. Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

3. Configure the following in `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/autodev

# GitHub OAuth (create app at https://github.com/settings/developers)
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Session security
SESSION_SECRET=generate-a-random-secret-here

# Application URLs
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379

# LLM Configuration (OpenRouter recommended)
LLM_PROVIDER=openrouter
LLM_API_KEY=your_openrouter_api_key
LLM_MODEL=openai/gpt-3.5-turbo
LLM_MODEL_CODE_GEN=openai/gpt-4-turbo
LLM_MODEL_CODE_REVIEW=anthropic/claude-3-sonnet

# Supermemory (for project context)
SUPERMEMORY_API_KEY=your_supermemory_api_key
```

4. Start infrastructure services:

```bash
docker-compose up -d
```

5. Install dependencies and setup database:

```bash
bun run setup
```

6. Start the development servers:

```bash
bun run dev
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Connector Service:** http://localhost:3001
- **Deployment Service:** http://localhost:3002

---

## Architecture Overview

AutoDev uses a microservices architecture with specialized AI agents that communicate through a centralized event bus.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND                                   │
│                    React + TypeScript + Tailwind                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │  Dashboard  │ │ Story List  │ │ Kanban View │ │ File Editor │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              TypeScript Backend (Port 3000)                  │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  │  │
│  │  │ Orchestrator │ │  Agent Pool  │ │ REST API + Auth      │  │  │
│  │  └──────────────┘ └──────────────┘ └──────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────┐ ┌──────────────────────────────────┐ │
│  │ Connector Service (3001) │ │ Deployment Service (3002)        │ │
│  │ ADO/Jira Integration     │ │ Preview URL Generation           │ │
│  └──────────────────────────┘ └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
         ┌──────────┐  ┌──────────┐  ┌──────────────┐
         │ Postgres │  │  Redis   │  │ Supermemory  │
         │ Database │  │EventBus  │  │   Context    │
         └──────────┘  └──────────┘  └──────────────┘
```

### Agent Pool Architecture

The platform runs 9 specialized AI agents, each with a single responsibility:

```
                    ┌─────────────────────────────────────────┐
                    │             ORCHESTRATOR                 │
                    │    Coordinates pipeline execution        │
                    │    Manages story queue & state           │
                    └───────────────────┬─────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        ▼                               ▼                               ▼
┌───────────────┐               ┌───────────────┐               ┌───────────────┐
│ PHASE 1       │               │ PHASE 2       │               │ PHASE 3       │
│ Task Divider  │ ──────────►   │ Task Reviewer │ ──────────►   │ Prioritizer   │
│ Breaks stories│               │ Validates &   │               │ Topological   │
│ into subtasks │               │ subdivides    │               │ sort + DAG    │
└───────────────┘               └───────────────┘               └───────────────┘
                                                                        │
        ┌───────────────────────────────────────────────────────────────┘
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: PARALLEL CODE GENERATION                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ Frontend Gen    │  │ Backend Gen     │  │ Database Gen    │             │
│  │ React/TS code   │  │ API endpoints   │  │ Schema/Prisma   │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           └──────────────┬─────┴────────────────────┘                       │
│                          ▼                                                  │
│                 ┌─────────────────┐                                         │
│                 │ Code Reviewer   │ ◄─────── Approve or send back           │
│                 │ Quality/Security│                                         │
│                 └─────────────────┘                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: TESTING                                                            │
│  ┌─────────────────┐              ┌─────────────────┐                       │
│  │ Test Generator  │ ──────────►  │ Test Executor   │                       │
│  │ Unit/E2E tests  │              │ Docker sandbox  │                       │
│  └─────────────────┘              └─────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │ PHASE 6         │
                              │ Deployment      │
                              │ Preview URLs    │
                              └─────────────────┘
```

### Supporting Agents

- **Project Analyzer Agent** - Detects languages, frameworks, and generates build commands
- **Prompt Optimizer Agent** - Uses 4-D methodology to improve prompt effectiveness
- **Documentation Agent** - Generates code documentation automatically

---

## Core Features

### 1. GitHub Integration

Connect any public or private repository. The system:
- Clones the repo and indexes all files
- Analyzes project structure (monorepo, frontend-only, fullstack, etc.)
- Detects languages, frameworks, and package managers
- Stores files in PostgreSQL with metadata
- Indexes content in Supermemory for semantic search

### 2. User Story Management

Create stories directly in the dashboard or import from external systems. Each story goes through:

| Status | Description |
|--------|-------------|
| `pending` | Waiting in queue |
| `dividing` | Being broken into subtasks |
| `reviewing` | Tasks being validated |
| `tasks_ready` | Ready for code generation |
| `generating` | AI writing code |
| `code_review` | Automated quality checks |
| `testing` | Running test suites |
| `deploying` | Creating preview |
| `completed` | All done |
| `failed` | Something went wrong |
| `cancelled` | User cancelled |

### 3. Multi-Agent Pipeline

The orchestrator runs stories one at a time to maintain isolation. Within each story, tasks are processed in parallel where dependencies allow.

**Key capabilities:**
- Dependency graph with topological sorting
- Circular dependency detection
- Parallel task execution for independent tasks
- Automatic retry with exponential backoff
- File snapshots for rollback on failure

### 4. Intelligent Code Generation

The Code Generator Agent:
- Retrieves relevant project context from Supermemory
- Generates complete files or patches for modifications
- Supports multiple output formats (new file, modify, delete)
- Handles both frontend and backend code
- Regenerates based on review feedback

### 5. Automated Code Review

Every generated artifact passes through the Code Reviewer which checks:
- Correctness and logic errors
- Code quality and style
- Security vulnerabilities
- Performance issues
- Type safety (for TypeScript)
- Requirement adherence

Artifacts are scored and either approved or sent back for revision.

### 6. Test Generation & Execution

The Test Generator creates:
- Unit tests for individual functions/components
- Integration tests for API endpoints
- E2E tests for user flows

The Test Executor runs everything in isolated Docker containers, preventing tests from affecting the host system.

### 7. Rollback Support

Before any story execution, the system snapshots all project files. If something fails:
- Modified files are restored to their original state
- Newly created files are deleted
- The project returns to exactly how it was before

Users can also manually cancel a story and trigger rollback.

### 8. Real-time Dashboard

The frontend provides:
- Pipeline Kanban board showing story progress
- Story activity sidebar with live agent logs
- File tree with Monaco editor integration
- Project import modal (GitHub URL or manual)
- Auto-refresh every 3 seconds during processing

---

## Technology Stack

### Backend

| Layer | Technology |
|-------|------------|
| Runtime | Bun (TypeScript) |
| Framework | Express.js |
| Database | PostgreSQL + Prisma ORM |
| Cache/Events | Redis (Pub/Sub) |
| Auth | Passport.js + GitHub OAuth |
| LLM Client | OpenAI SDK (works with OpenRouter) |
| Memory | Supermemory API |
| Containers | Docker (dockerode) |

### Frontend

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Components | shadcn/ui + Lucide icons |
| Editor | Monaco Editor |
| Animations | Framer Motion |
| Drag & Drop | @dnd-kit |
| HTTP Client | Axios |
| State | Zustand |

### LLM Models (via OpenRouter)

| Purpose | Recommended Model |
|---------|-------------------|
| Quick tasks | GPT-3.5 Turbo |
| Code generation | GPT-4 Turbo |
| Code review | Claude 3 Sonnet |

---

## Project Structure

```
AutoDev/
├── backend-typescript/       # Main backend service
│   ├── src/
│   │   ├── agents/          # 9 specialized AI agents
│   │   │   ├── baseAgent.ts         # Abstract base class
│   │   │   ├── orchestrator.ts      # Pipeline coordinator
│   │   │   ├── taskDividerAgent.ts  # Phase 1
│   │   │   ├── taskReviewerAgent.ts # Phase 2
│   │   │   ├── taskPrioritizerAgent.ts # Phase 3
│   │   │   ├── codeGeneratorAgent.ts   # Phase 4
│   │   │   ├── codeReviewerAgent.ts    # Phase 4
│   │   │   ├── testGeneratorAgent.ts   # Phase 5
│   │   │   ├── testExecutorAgent.ts    # Phase 5
│   │   │   ├── projectAnalyzerAgent.ts # Supporting
│   │   │   └── promptOptimizerAgent.ts # Supporting
│   │   ├── llm/             # LLM client and prompts
│   │   │   ├── client.ts    # OpenAI-compatible client
│   │   │   └── prompts/     # Prompt templates
│   │   ├── redis/           # Event bus implementation
│   │   ├── routes/          # REST API endpoints
│   │   ├── services/        # Business logic
│   │   │   ├── sandboxService.ts  # Docker execution
│   │   │   ├── rollbackService.ts # File snapshots
│   │   │   └── storyQueue.ts      # Story prioritization
│   │   ├── supermemory/     # Project context search
│   │   └── types/           # TypeScript definitions
│   └── prisma/
│       └── schema.prisma    # Database schema
│
├── frontend/                 # React dashboard
│   └── src/
│       ├── components/
│       │   ├── dashboard/   # Dashboard components
│       │   │   ├── PipelineKanbanBoard.tsx
│       │   │   ├── StoryActivitySidebar.tsx
│       │   │   ├── FileViewer.tsx
│       │   │   └── ...
│       │   ├── common/      # Shared components
│       │   └── home/        # Landing page
│       ├── pages/           # Route pages
│       ├── stores/          # Zustand state
│       └── utils/           # API client
│
├── connector-service/        # ADO/Jira connector (Port 3001)
├── deployment-service/       # Preview deployment (Port 3002)
├── docker-compose.yml        # Infrastructure
└── package.json             # Root scripts
```

---

## Database Schema

The system uses these main models:

**User** - GitHub-authenticated users with encrypted tokens

**Project** - Repositories with source tracking (GitHub URL, files)

**Story** - User stories with status tracking through pipeline phases

**Task** - Atomic units of work derived from stories
- Types: frontend, backend, database, integration
- Supports parent-child relationships for subdivisions
- Tracks dependencies as JSON array

**CodeArtifact** - Generated code with version history
- Links to task and optional file
- Stores review notes and approval status

**TestResult** - Test execution outcomes with coverage metrics

**AgentLog** - Complete audit trail of all agent actions

**FileSnapshot** - Pre-execution file states for rollback

**Deployment** - Preview URL tracking

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/github` | Start GitHub OAuth |
| GET | `/api/auth/github/callback` | OAuth callback |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | End session |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user projects |
| POST | `/api/projects` | Create new project |
| POST | `/api/github/import` | Import from GitHub |
| GET | `/api/projects/:id` | Get project details |
| DELETE | `/api/projects/:id` | Delete project |

### Stories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/stories` | List stories |
| POST | `/api/projects/:id/stories` | Create story |
| GET | `/api/projects/:id/stories/:storyId` | Get story details |
| PUT | `/api/projects/:id/stories/:storyId` | Update story |
| DELETE | `/api/projects/:id/stories/:storyId` | Delete story |
| POST | `/api/projects/:id/stories/:storyId/cancel` | Cancel & rollback |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stories/:storyId/tasks` | List tasks |
| GET | `/api/tasks/:id` | Get task details |

### Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/logs` | Get agent logs |

---

## Event-Driven Communication

All agents communicate through Redis Pub/Sub. Key events:

| Event | Publisher | Payload |
|-------|-----------|---------|
| `QUEUE_CHECK` | API | projectId |
| `TASKS_CREATED` | Task Divider | storyId, taskIds, count |
| `TASKS_REVIEWED` | Task Reviewer | storyId, allApproved |
| `TASKS_PRIORITIZED` | Prioritizer | storyId, batchCount |
| `CODE_GENERATED` | Code Generator | taskId, artifactId |
| `CODE_APPROVED` | Code Reviewer | taskId, artifactId |
| `TESTS_GENERATED` | Test Generator | taskId, fileCount |
| `TESTS_EXECUTED` | Test Executor | taskId, passed |
| `STORY_COMPLETED` | Orchestrator | storyId, previewUrl |
| `STORY_FAILED` | Orchestrator | storyId, phase, reason |
| `STORY_CANCELLED` | API | storyId, rolledBack |

---

## Data Privacy & Security Notes

### ADO/External Data Handling
- All external integrations use OAuth 2.0 with encrypted token storage
- Only necessary work items (user stories) are fetched and stored
- User data is isolated per account (multi-tenancy)
- Tokens are never logged or exposed in API responses

### API Key Management
- LLM API keys stored exclusively in environment variables
- Keys never committed to version control (`.env` is gitignored)
- Support for key rotation through environment updates
- OpenRouter provides additional abstraction layer

### Generated Code Security
- All code artifacts stored in PostgreSQL with user isolation
- Code execution happens in ephemeral Docker containers
- Containers are destroyed after test completion
- No persistent state leaks between sandbox runs

### User Data Privacy
- GitHub authentication uses standard OAuth flow
- Session data encrypted with configurable secret
- File snapshots are temporary and cleaned up on completion
- Comprehensive audit logging for all agent actions

### Network Security
- All services communicate over localhost in development
- CORS configured to only allow frontend origin
- Session cookies use secure flags in production
- Health check endpoints don't expose sensitive data

---

## Running Tests

The project includes several testing layers:

```bash
# Run backend linting
bun run lint:ts-backend

# Run frontend linting
bun run lint:frontend

# Database migrations (if schema changes)
bun run db:migrate

# Open Prisma Studio (database UI)
bun run db:studio
```

---

## Useful Commands

```bash
# Start all services
bun run dev

# Start individual services
bun run dev:ts-backend    # Main backend only
bun run dev:frontend      # Frontend only

# Install dependencies for all services
bun run install:all

# Format code
bun run format

# Check formatting
bun run format:check

# Stop all running services
bun run stop

# Clean all node_modules
bun run clean
```

---

## Troubleshooting

### "Redis connection refused"
Make sure Docker is running and execute:
```bash
docker-compose up -d redis
```

### "GitHub OAuth error"
1. Verify your GitHub OAuth app settings
2. Callback URL must exactly match `GITHUB_CALLBACK_URL`
3. Make sure client ID and secret are correct

### "LLM API errors"
1. Confirm `LLM_API_KEY` is set correctly
2. Check your OpenRouter balance/limits
3. Try a different model if rate limited

### "Supermemory errors"
These are non-fatal. The system runs without Supermemory but won't have project context during code generation.

### "Docker not available"
Test execution requires Docker. Install Docker Desktop and ensure it's running.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and tests
5. Submit a pull request

---

## License

This project was created for Techfest 2025-26 competition. All rights reserved.

---

Built with care by **Team Binary Pheonix** ✨
