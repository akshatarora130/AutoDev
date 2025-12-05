# AutoDev Hackathon -- Collaborative Agentic Platform

**Team Name:** **Binary Pheonix**  
**Team ID:** **Auto-250366**  
**Competition:** Techfest 2025--26

---

## Problem Understanding

The software development lifecycle requires developers to manually parse requirements, break down user stories, write code across multiple layers (frontend, backend, database), create tests, review code, and deploy applications. This process is time-consuming, error-prone, and leads to inconsistent code quality.

Our **multi-agent development workflow** employs **specialized autonomous agents** that collaborate through a centralized event bus to automate the entire pipeline. Unlike a monolithic "god agent," our system uses specialized agents for task division, code generation, testing, and review, with parallel execution and recursive refinement capabilities.

### Key Innovation: 90--95% Automation

Users connect their Azure DevOps project or submit user stories. The system automatically processes multiple user stories sequentially, prioritizes them based on dependencies and business value, generates complete full-stack applications (frontend, backend, database), creates and executes comprehensive test suites, and deploys applications with live preview URLs. All of this happens autonomously in the background, requiring minimal human intervention.

---

## Proposed Architecture

Our Collaborative Agentic Platform uses a **multi-agent orchestration architecture** with specialized agents working collaboratively through an event-driven system. The architecture consists of a User Interface Layer (Web Dashboard), an Orchestration & Coordination Layer (Event Bus with Redis Pub/Sub, State Store with PostgreSQL, and LangGraph Orchestrator), an ADO Connector & Parser, an Agent Pool with 9 specialized agents, and a Deployment Service. All agents communicate only via the centralized Event Bus.

### Agent Responsibilities

1. **Task Divider Agent**: Breaks user stories into implementable subtasks.
2. **Task Reviewer Agent**: Reviews subtasks and recursively divides complex ones.
3. **Task Prioritizer Agent**: Prioritizes stories and tasks based on dependencies and ADO metadata.
4. **Code Generator Agent**: Generates frontend, backend, and database code (parallel instances).
5. **Code Reviewer Agent**: Reviews code quality, security, and requirement adherence.
6. **Test Generator Agent**: Creates unit, integration, and E2E tests.
7. **Test Reviewer & Executor Agent**: Reviews and executes tests, generates coverage reports.
8. **Prompt Refinement Agent**: Continuously improves prompts based on performance metrics.
9. **Legacy Code Analyzer Agent**: Analyzes existing codebases for integration.

### Communication Model

All agents communicate through a **centralized Event Bus** (Redis Pub/Sub). Agents publish events (e.g., "tasks_created", "code_approved") and subscribe to relevant topics. The Orchestrator manages a story-level queue for sequential story processing (one story at a time) and task-level queues enabling parallel processing of independent tasks within each story while respecting dependencies.

---

## Mandatory Workflow Diagram

```
+------------------------------+-------------------------------------+
|                         INPUT: Azure DevOps Project                |
|          [Story 1, Story 2, Story 3, ...] (API / File Upload)      |
+------------------------------+-------------------------------------+
                               |
                               v
+------------------------------+-------------------------------------+
|                      ADO CONNECTOR & PARSER                        |
|  - Fetch all stories                                               |
|  - Extract metadata (priority, tags, links)                        |
|  - Normalize user stories                                          |
+------------------------------+-------------------------------------+
                               |
                               v
+--------------------------- PHASE 1 --------------------------------+
|                    TASK DIVISION & RANKING                         |
|                                                                    |
|  Task Divider Agent                                                |
|    -> Divide ALL stories into small tasks                          |
|    -> Rank order of execution for all tasks                        |
|       (e.g., FE, BE, DB, Auth, Tests, etc.)                        |
+------------------------------+-------------------------------------+
                               |
+--------------------------- PHASE 2 --------------------------------+
|                         TASK REVIEW                                |
|                                                                    |
|  Task Reviewer Agent (recursive)                                   |
|    -> Review all tasks                                             |
|    -> Validate subtasks                                            |
|    -> Break down any complex task further                          |
|       until "implementable" units                                  |
+------------------------------+-------------------------------------+
                               |

+------------------------------+-------------------------------------+
|                    TASK QUEUE (RANKED ORDER)                       |
|   [ Task 1 (P1) ] --> [ Task 2 (P2) ] --> [ Task 3 (P3) ] ...      |
+------------------------------+-------------------------------------+
                               |
                         pick current task
                               |
+--------------------------- PHASE 3 --------------------------------+
|                       CODE GENERATION (PARALLEL)                   |
|                                                                    |
|    +----------------+    +----------------+    +----------------+  |
|    | Frontend       |    | Backend        |    | Database       |  |
|    | Code Gen Agent |    | Code Gen Agent |    | Code Gen Agent |  |
|    +--------+-------+    +--------+-------+    +--------+-------+  |
|             \                   |                    /             |
|              \                  |                   /              |
|               \                 |                  /               |
|                +----------------------------------+                |
|                |           Code Reviewer Agent    |                |
|                |  - Style & quality checks        |                |
|                |  - Security & best practices     |                |
|                |  - Requirement adherence         |                |
|                +----------------+-----------------+                |
|                                 |                                  |
|                    issues? yes  |  no                              |
|                      +---------+---------+                         |
|                      |                   |                         |
|                send back for       proceed to tests                |
|                  revision                                          |
+------------------------------+-------------------------------------+
                               |
+--------------------------- PHASE 5 --------------------------------+
|                            TESTING                                 |
|                                                                    |
|  Test Generator Agent                                              |
|    -> Generate unit tests                                          |
|    -> Generate integration tests                                   |
|    -> Generate E2E tests                                           |
|                                                                    |
|  Test Reviewer & Executor Agent                                    |
|    -> Review test coverage and relevance                           |
|    -> Execute tests in isolated Docker environment                 |
|    -> Collect results & coverage metrics                           |
|                                                                    |
|                tests failing?                                      |
|                +------------+                                      |
|              yes            no                                     |
|                |            |                                      |
|     send defects / feedback   proceed to integration & deploy      |
+------------------------------+-------------------------------------+
                               |
+--------------------------- PHASE 6 --------------------------------+
|                    INTEGRATION & DEPLOYMENT                        |
|                                                                    |
|  - Merge validated modules (FE, BE, DB)                            |
|  - Run final integration tests                                     |
|  - Deploy to staging (AWS)                                          |
|  - Provision managed Postgres (Supabase / Neon)                    |
|  - Generate Live Preview URL                                       |
|  - Update dashboard with status, logs, test reports                |
+------------------------------+-------------------------------------+
                               |
+------------------------------+-------------------------------------+
|                        TASK COMPLETE ✓                             |
+------------------------------+-------------------------------------+
                               |
+------------------------------+-------------------------------------+
|              Next Task in Queue (Execute One by One)               |
+------------------------------+-------------------------------------+
                               |
+------------------------------+-------------------------------------+
|                  LIVE PREVIEW & OPERATIONS DASHBOARD               |
|  - List of deployed stories and preview URLs                       |
|  - In-browser code editor (Monaco)                                 |
|  - Test and coverage reports                                       |
|  - Agent activity and logs                                         |
+--------------------------------------------------------------------+
```

**Flow**: ADO Input → ADO Connector & Parser → Task Division & Ranking (All Stories) → Task Review → Task Execution (One by One) → Code Generation → Code Review → Test Generation & Execution → Integration & Deployment → Dashboard

---

## Technical Stack

### Orchestration & Backend

- **Language**: Python 3.11+.
- **Frameworks**: **LangGraph** (orchestration), **FastAPI** (REST API), **Celery** (task queue).
- **Message Bus**: Redis (pub/sub for agent communication).
- **State Store**: PostgreSQL (task state, code artifacts, metadata).

### AI/ML Models

- **Primary LLM Provider**: OpenRouter API (aggregates multiple LLM providers).
- **Models**: GPT-4 Turbo/GPT-4o (code generation), Claude 3.5 Sonnet (code review), CodeLlama (specialized tasks).
- **Rationale**: Cost optimization, fallback mechanisms, access to multiple models.
- **Embeddings**: OpenAI `text-embedding-3-large` for semantic search.
- **Prompt Management**: LangChain `PromptTemplate`s.

### Frontend & UI

- **Framework**: React 18+ with TypeScript.
- **UI Library**: Tailwind CSS + shadcn/ui components.
- **Code Editor**: Monaco Editor (VS Code editor in browser).
- **Real-time Updates**: WebSocket connection for live agent activity.

### Generated Code Stack

- **Frontend**: React with TypeScript, Tailwind CSS.
- **Backend**: Node.js (Express) or Python (FastAPI).
- **Database**: PostgreSQL with Prisma ORM (Node.js) or SQLAlchemy (Python).
- **Authentication**: JWT-based auth system.
- **API**: RESTful API design.

### Testing & Deployment

- **Test Frameworks**: Jest (JS/TS), pytest (Python), Playwright (E2E).
- **Test Execution**: Isolated Docker containers per test suite.
- **Deployment**: AWS (EC2/ECS for backend, S3/CloudFront for frontend, RDS for database).

---

## Data Privacy & Security

### ADO Data Handling

- **Authentication**: OAuth 2.0 with Azure AD.
- **Token Storage**: Encrypted at rest using AES-256, automatic rotation.
- **Data Minimization**: Only fetch required work items (user stories).
- **Retention Policy**: User data deleted after 30 days of inactivity.

### API Key Management

- **LLM API Keys**: Stored in environment variables (never in code).
- **Production**: Secrets management service (AWS Secrets Manager / HashiCorp Vault).
- **Development**: `.env` files (gitignored).
- **Key Rotation**: Multiple keys with automatic failover.

### Generated Code Security

- **Code Scanning**: Automated security analysis before deployment.
- **Dependency Check**: Snyk integration for vulnerability scanning.
- **Secrets Detection**: Prevents hardcoded credentials in generated code.
- **Input Validation**: All generated APIs include input sanitization.

### User Data Privacy

- **Data Isolation**: Each user's projects are isolated (multi-tenancy).
- **GDPR Compliance**: User data export and deletion capabilities.
- **Audit Logging**: All agent actions logged for traceability.
- **Access Control**: Role-based access control (RBAC) for team members.

### Infrastructure Security

- **HTTPS**: All communications encrypted (TLS 1.3).
- **CORS**: Strict CORS policies for API endpoints.
- **Rate Limiting**: Prevent abuse and control costs.
- **Input Sanitization**: All user inputs validated and sanitized.

---

## Anticipated Challenges & Solutions

### Challenge 1: Agent Coordination & Deadlock Prevention

**Problem**: Managing dependencies, preventing deadlocks, and handling agent failures without breaking the entire pipeline.

**Solution**:

- **Dependency Graph**: Task Prioritizer Agent creates a DAG (Directed Acyclic Graph) of task dependencies.
- **Orchestrator with Deadlock Detection**: Central orchestrator monitors task states and detects circular dependencies.
- **Timeout Mechanisms**: Each agent task has a timeout; if exceeded, the task is marked as failed and retried or reassigned.
- **Failure Handling**: Retry logic with exponential backoff, fallback to alternative agents if primary agent fails, manual intervention queue for unresolvable issues.
- **State Management**: Centralized state store (PostgreSQL) tracks all task states atomically.
- **Implementation**: LangGraph's state management for dependency tracking, Celery task retry mechanisms, circuit breaker pattern for agent health monitoring.

### Challenge 2: Cost Management & LLM API Rate Limits

**Problem**: LLM API calls are expensive, and with multiple agents making concurrent calls, costs can escalate quickly. API rate limits might throttle agent execution.

**Solution**:

- **Model Selection Strategy**: Use cost-effective models (e.g., GPT-3.5) for simple tasks, GPT-4 for complex reasoning.
- **Caching**: Cache similar prompts/responses to avoid redundant API calls.
- **Batch Processing**: Group similar tasks to reduce API calls.
- **Rate Limiting**: Implement token bucket algorithm to respect API limits.
- **Cost Monitoring**: Real-time cost tracking dashboard with alerts.
- **OpenRouter Benefits**: Leverage OpenRouter's aggregation to automatically switch providers if one is rate-limited.
- **Implementation**: Redis caching layer for prompt/response pairs, LangChain's LLM caching decorators, custom rate limiter middleware, cost tracking in database with per-task attribution.
