# PostPulse – Multi-Platform Social Media Management System

[![CI Pipeline](https://github.com/postpulse/postpulse/actions/workflows/ci.yml/badge.svg)](https://github.com/postpulse/postpulse/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![Kafka](https://img.shields.io/badge/Apache%20Kafka-3.x-black.svg)](https://kafka.apache.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io)

---

## 1. Project Overview

**PostPulse** is an enterprise-grade, distributed multi-platform social media orchestration and analytics system. It enables marketing teams, enterprise organizations, and digital agencies to compose, validate, schedule, and syndicate publications seamlessly across **X (Twitter)**, **Instagram**, **Facebook**, **LinkedIn**, and **YouTube**.

Designed as a modern SaaS architecture, PostPulse implements:
- **Role-Based Access Control (RBAC)** across four hierarchical tiers: `ADMIN`, `MANAGER`, `EDITOR`, and `VIEWER`.
- **Event-Driven Asynchronous Syndication** powered by **Apache Kafka** with retry mechanisms, exponential backoff, dead-letter queues (DLQ), and idempotent message processing.
- **Zero-Knowledge Credential Security** using **AES-256-GCM** authenticated encryption with random 96-bit initialization vectors (IVs) to protect third-party OAuth access tokens.
- **Two-Tier Cache Acceleration** using **Redis** (`@Cacheable`, `@CacheEvict`) for high-throughput analytics reads and sub-millisecond telemetry queries.
- **Canary Deployment Infrastructure** with **Docker Compose**, **Nginx** reverse proxy weighted routing, automated health checking, and zero-downtime traffic migration.

---

## 2. Key Modules & Functional Features

| Module | Primary Capabilities |
| :--- | :--- |
| **Operational Dashboard** | Real-time cross-platform KPI cards (published, scheduled, drafts, failed, impressions, reach), interactive SVG area charts, engagement trends, and weekly cadence distribution. |
| **Multi-Platform Post Composer** | Unified authoring interface with real-time circular character counters, platform-specific validation warnings, media attachments with sample assets gallery, hashtag suggestion chips, and live channel previews (X tweet card, Instagram feed, LinkedIn post, Facebook update, YouTube community). |
| **Draft Management** | Full CRUD lifecycle, autosave debouncing with visual status indicators, duplicate draft, search by keyword/tag, platform filters, and sort by created/modified timestamps. |
| **Content Calendar** | Multi-view calendar (**Month**, **Week**, **Day**, and **List/Agenda** views), drag-and-drop rescheduling across dates, platform color-coded chips, timezone conversion (UTC, EST, GMT, IST, JST), and detailed inspection modal. |
| **Connected Accounts** | Management of 5 major social channels, followers count tracking, connection status monitor, and **AES-256-GCM** encryption seal indicators. |
| **Analytics & Telemetry** | 30-day cross-platform metrics, platform breakdown comparison tables, top-performing publication highlights, and Redis cache telemetry (hit rate, active keys, flush cache trigger). |
| **Team & RBAC Management** | User directory, dynamic role tier assignment, fine-grained permission enforcement, and team invitation dialog. |
| **Forensic Audit Trail** | Immutable security audit log tracking user email, action, entity, timestamp, IP address, and distributed correlation IDs (`X-Correlation-Id`). |
| **Kafka & Cache Event Console** | Live inspection of Kafka event streams (`post-scheduled`, `post-published`, `post-failed`, `post-notifications`, `post-dlq`), partitions, offsets, JSON payload viewer, and dead-letter queue (DLQ) replay execution. |

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19, TypeScript
- **State Management**: Redux Toolkit (8 domain slices: auth, posts, drafts, platforms, calendar, notifications, analytics, users)
- **Styling**: Tailwind CSS v4, Plus Jakarta Sans typography, Lucide React icons
- **Networking**: Axios with JWT Bearer interceptor, correlation ID propagation, and automatic 401 refresh queue
- **Testing**: Vitest, React Testing Library

### Backend
- **Framework**: Spring Boot 3.3.4, Java 17
- **Security**: Spring Security 6 (Stateless JWT, BCrypt password hashing, method-level `@PreAuthorize` RBAC)
- **Persistence**: Spring Data JPA, Hibernate, PostgreSQL 16
- **Database Migrations**: Flyway (V1 schema creation, V2 seed data)
- **Distributed Messaging**: Spring Kafka, Apache Kafka 3.x, Zookeeper
- **Caching**: Spring Cache, Redis 7 (`@Cacheable`, `@CacheEvict`)
- **Cryptography**: AES-256-GCM authenticated cipher (`javax.crypto`)
- **Observability**: Spring Boot Actuator, Micrometer, Structured JSON Logging

### Infrastructure & DevOps
- **Containers**: Multi-stage Dockerfiles (Maven + JRE 17 Alpine, Node 20 + Nginx Alpine)
- **Orchestration**: Docker Compose (8 coordinated microservices)
- **Proxy & Traffic Routing**: Nginx with weighted upstream canary routing
- **CI/CD**: GitHub Actions (linting, tests, build packages, GHCR container publishing, canary promotion)

---

## 4. System Architecture

```
                          ┌─────────────────────────────────────┐
                          │         Client Web Browser          │
                          │   (React 19 + Redux Toolkit + Vite) │
                          └──────────────────┬──────────────────┘
                                             │ HTTPS / JWT
                                             ▼
                          ┌─────────────────────────────────────┐
                          │          Nginx Reverse Proxy        │
                          │   (Canary Traffic Split: 90% / 10%) │
                          └──────────┬───────────────┬──────────┘
                                     │ 90%           │ 10%
                    ┌────────────────┴──────┐     ┌──┴──────────────────┐
                    │ Backend Stable (8081) │     │ Backend Canary (8082)│
                    │   Spring Boot 3.3.4   │     │   Spring Boot 3.3.4  │
                    └──────────┬────────────┘     └──┬──────────────────┘
                               │                     │
         ┌─────────────────────┼─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  PostgreSQL 16   │  │     Redis 7      │  │   Apache Kafka   │  │   AES-256-GCM    │
│ (Relational Data │  │ (Read-Through    │  │ (post-scheduled, │  │ (Encrypted OAuth │
│  Flyway Schema)  │  │  Cache Layer)    │  │  post-dlq, etc.) │  │  Access Tokens)  │
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 5. Folder Structure

```
postpulse/
│
├── frontend/ / src/             # React 19 SPA Frontend
│   ├── components/
│   │   ├── auth/                # Login, Registration & 1-Click Role Switcher
│   │   ├── calendar/            # Interactive Content Calendar (Month/Week/Day/List)
│   │   ├── common/              # Badges, Toasts, Confirmation Modals
│   │   ├── composer/            # Multi-Platform Post Composer & Live Previews
│   │   ├── dashboard/           # KPI Cards, SVG Charts, Queues, Recent Activity
│   │   ├── drafts/              # Draft Management CRUD
│   │   ├── kafka/               # Kafka Event Bus & DLQ Inspector Modal
│   │   ├── layout/              # Collapsible Sidebar & Top Navbar
│   │   ├── platforms/           # Connected Social Accounts & AES Indicators
│   │   └── users/               # Team Management & Security Audit Trail
│   ├── services/                # Axios Client with JWT Refresh Interceptor
│   ├── store/                   # Redux Toolkit Store & 8 Domain Slices
│   ├── types/                   # TypeScript Domain Interfaces & DTOs
│   └── tests/                   # Vitest Unit and Integration Tests
│
├── backend/                     # Spring Boot 3.3 Java Backend
│   ├── src/main/java/com/postpulse/
│   │   ├── cache/               # RedisCacheConfig
│   │   ├── controller/          # REST Controllers (Post, Auth, Analytics, etc.)
│   │   ├── entity/              # JPA Entities (Post, User, ConnectedAccount, etc.)
│   │   ├── event/               # Kafka Producer, Consumer, DLQ & Events
│   │   ├── exception/           # GlobalExceptionHandler & ApiErrorResponse
│   │   ├── repository/          # Spring Data JPA Repositories
│   │   ├── security/            # JwtTokenProvider, SecurityConfig, Filters
│   │   └── service/             # Business Logic & AES-256-GCM EncryptionService
│   ├── src/main/resources/
│   │   ├── application.yml      # Spring Boot Environment Configuration
│   │   └── db/migration/        # Flyway SQL Migrations (V1 Schema, V2 Seed)
│   ├── Dockerfile               # Multi-Stage Maven + JRE 17 Alpine Dockerfile
│   └── pom.xml                  # Maven Project Object Model
│
├── deploy/                      # Canary Deployment & Infrastructure
│   ├── nginx/
│   │   └── canary.conf          # Weighted Upstream Traffic Split Configuration
│   └── scripts/
│       ├── health-check.sh      # Automated Actuator Health Verification
│       ├── canary-promote.sh    # Stepwise Traffic Promotion (10% -> 100%)
│       ├── canary-rollback.sh   # Emergency Failback to 100% Stable
│       └── test-traffic-split.sh # Traffic Distribution Benchmark
│
├── .github/workflows/
│   ├── ci.yml                   # GitHub Actions CI (Node + Java + Tests + Docker)
│   └── cd.yml                   # GitHub Actions CD (GHCR Publishing & Deployment)
│
├── server.ts                    # Full-Stack Express / Node API Engine & Vite Integration
├── server/                      # In-Memory DB, JWT, AES, Kafka Simulator & Routes
├── docker-compose.yml           # Multi-Container Deployment (Postgres, Redis, Kafka, etc.)
└── README.md                    # System Documentation & Viva Defense Guide
```

---

## 6. Prerequisites

To execute PostPulse locally or in containerized mode, ensure the following prerequisites are installed:
- **Node.js**: v18.x or v20.x LTS
- **npm**: v9.x or later
- **Java Development Kit (JDK)**: OpenJDK 17 or Eclipse Temurin 17
- **Apache Maven**: 3.9+
- **Docker & Docker Compose**: v24+

---

## 7. Step-by-Step Installation & Execution

### Option A: Interactive Full-Stack Web Mode (Fastest)

PostPulse features an integrated full-stack server running Express and Vite simultaneously:

```bash
# 1. Install dependencies
npm install

# 2. Launch the integrated full-stack server (Port 3000)
npm run dev
```

Visit `http://localhost:3000` in your web browser.

#### Instant 1-Click Evaluation Credentials:
You can log in or use the **1-Click Role Switcher** buttons in the UI:
- **ADMIN**: `admin@postpulse.io` / `Pulse123!` (Full permissions)
- **MANAGER**: `manager@postpulse.io` / `Pulse123!` (Team, accounts, analytics)
- **EDITOR**: `editor@postpulse.io` / `Pulse123!` (Create, edit, schedule posts)
- **VIEWER**: `viewer@postpulse.io` / `Pulse123!` (Read-only access)

---

### Option B: Docker Compose Multi-Container Deployment

To boot the entire distributed microservice architecture (Postgres, Redis, Kafka, Zookeeper, Stable Backend, Canary Backend, and Nginx Gateway):

```bash
# 1. Create a local environment file and replace the development-only values
cp .env.example .env

# 2. Build and start all 8 containers
docker compose up --build -d

# 3. Verify running containers
docker compose ps

# 4. Check container logs
docker compose logs -f nginx-gateway
```

The Compose deployment requires `POSTGRES_PASSWORD`, `JWT_SECRET`, and `AES_SECRET_KEY` from `.env`. The values in `.env.example` are for local development only; use unique secrets in deployed environments and keep `.env` out of Git.

Access the application via the Nginx Gateway at `http://localhost:80`.

---

## 8. Database Architecture & Migrations

PostPulse utilizes **PostgreSQL 16** managed via **Flyway** migrations:

1. **`V1__init_schema.sql`**:
   - `users`: Stores user profile data, department, and BCrypt password hashes.
   - `roles`: Defines RBAC roles (`ADMIN`, `MANAGER`, `EDITOR`, `VIEWER`).
   - `social_platforms`: Platform definitions and rules (character limits, media requirements).
   - `connected_accounts`: Stores encrypted OAuth tokens (`encrypted_credential_blob`).
   - `posts` & `post_platforms`: Scheduled and published post contents, platform junctions, and JSON analytics.
   - `drafts` & `draft_platforms`: In-progress draft compositions.
   - `media_assets`: Uploaded images, dimensions, byte sizes, and MIME types.
   - `refresh_tokens`: Session refresh tokens with expiry timestamps.
   - `audit_logs`: Immutable security audit events indexed by `timestamp` and `correlation_id`.
   - `notifications`: System alerts and publishing status notifications.

2. **`V2__seed_data.sql`**:
   - Seeds default roles, 5 social platform constraints, default users, pre-connected accounts, and sample publications.

---

## 9. Redis Caching Strategy

PostPulse integrates **Redis 7** using Spring Cache:

- **`@Cacheable("analytics:overview")`**: Caches calculated dashboard metrics (impressions, reach, engagement rates) with a 2-minute TTL.
- **`@Cacheable("platforms:configs")`**: Caches static platform rules and limits with a 1-hour TTL.
- **`@CacheEvict(value = "analytics:overview", allEntries = true)`**: Triggered automatically upon creating, updating, or publishing any post to maintain strict read-after-write consistency.

---

## 10. Apache Kafka Event-Driven Architecture

### Event Topics:
1. **`post-scheduled`**: Published when a user schedules a publication for future dispatch.
2. **`post-published`**: Dispatched immediately upon successful multi-platform publishing.
3. **`post-failed`**: Triggered when a downstream platform API rejects a payload.
4. **`post-notifications`**: Dispatched to update user notification badges.
5. **`post-dlq`**: Dead-Letter Queue capturing messages that fail after 3 retry attempts.

### Reliability Guarantees:
- **Partition Keying**: All events are keyed by `postId`. Because Kafka guarantees strict FIFO ordering within each partition, state transitions for a given post never arrive out of order.
- **Idempotent Consumers**: The consumer maintains an in-memory/Redis set of `groupId:key:eventId`. Duplicate events caused by network retries are recognized and dropped without executing duplicate social posts.
- **Exponential Backoff**: Transient errors trigger retries with exponential backoff (`delay = 1000ms`, `multiplier = 2.0`).
- **DLQ Recovery**: Permanent failures route to `post-dlq`. Operators can inspect and replay the message directly from the **Kafka Console Modal**.

---

## 11. REST API Catalog & Sample Contracts

Every request receives or assigns an immutable `X-Correlation-Id` header for end-to-end tracing.

### 1. Authentication Endpoints

#### `POST /api/auth/login`
```json
// Request
{
  "email": "admin@postpulse.io",
  "password": "Pulse123!"
}

// Response (HTTP 200 OK)
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "8f9a2b1c4e...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "usr_admin",
    "name": "Alex Rivera",
    "email": "admin@postpulse.io",
    "role": "ADMIN",
    "department": "Executive Operations"
  }
}
```

### 2. Posts Endpoints

#### `GET /api/posts?page=0&size=10&sort=createdAt,desc&status=PUBLISHED`
Returns Spring Data `Pageable` structured JSON:
```json
{
  "content": [
    {
      "id": "post_101",
      "content": "We are thrilled to unveil PostPulse 3.0!",
      "platforms": ["twitter", "linkedin"],
      "status": "PUBLISHED",
      "authorName": "Sarah Chen",
      "publishedTime": "2026-10-28T14:00:00Z"
    }
  ],
  "pageable": { "pageNumber": 0, "pageSize": 10 },
  "totalElements": 24,
  "totalPages": 3,
  "last": false
}
```

#### `POST /api/posts` (Create & Publish / Schedule)
```json
// Request
{
  "content": "Exciting product update! Multi-platform scheduling is now live.",
  "platforms": ["twitter", "linkedin", "instagram"],
  "media": [
    {
      "id": "med_1",
      "url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
      "name": "update.png",
      "sizeBytes": 420000
    }
  ],
  "status": "SCHEDULED",
  "scheduledTime": "2026-11-05T14:30:00Z"
}

// Response (HTTP 201 Created)
{
  "id": "post_1742089123_abc",
  "status": "SCHEDULED",
  "scheduledTime": "2026-11-05T14:30:00Z",
  "authorName": "Alex Rivera"
}
```

---

## 12. Security Architecture: Hashing vs Encryption

| Security Aspect | Password Management | OAuth Credential Storage |
| :--- | :--- | :--- |
| **Mechanism** | **One-Way Cryptographic Hashing** | **Two-Way Authenticated Encryption** |
| **Algorithm** | BCrypt / PBKDF2 with SHA-512 & Salt | **AES-256-GCM** (Galois/Counter Mode) |
| **Reversibility** | Irreversible by design (verification via math comparison) | Reversible by authorized backend workers only |
| **Key Management** | Random per-user salt prepended to hash | 256-bit symmetric key in environment variable |
| **Integrity Check** | Timing-safe hash comparison | 128-bit GCM authentication tag |
| **Usage** | User login authentication | External API calling (X, Instagram, LinkedIn, etc.) |

---

## 13. Canary Deployment Demonstration

PostPulse includes automated scripts to test canary traffic routing:

```bash
# 1. Inspect initial status (90% Stable, 10% Canary)
cat deploy/nginx/canary.conf

# 2. Benchmark traffic split across 100 requests
bash deploy/scripts/test-traffic-split.sh 100

# 3. Promote Canary to 50% traffic
bash deploy/scripts/canary-promote.sh 50

# 4. Promote Canary to 100% traffic (Complete Rollout)
bash deploy/scripts/canary-promote.sh 100

# 5. Emergency Rollback (Instantly revert to 0% Canary / 100% Stable)
bash deploy/scripts/canary-rollback.sh
```

---

## 14. Testing Instructions

### Run Frontend Unit & Integration Tests:
```bash
# Run Vitest test suite
npx vitest run
```

### Run Backend Tests:
```bash
cd backend
mvn test
```

---

## 15. University Engineering Viva Q&A

**Q1: Why did you choose Apache Kafka over RabbitMQ or Redis Pub/Sub for social media scheduling?**
> *Answer*: Apache Kafka provides persistent log storage, replayability, and partition-based ordering. Unlike RabbitMQ or Redis Pub/Sub, Kafka guarantees that messages with the same partition key (`postId`) are consumed strictly in order. Furthermore, Kafka's Dead-Letter Queue (DLQ) and consumer offset management allow us to replay failed publications without losing state.

**Q2: What is the difference between BCrypt and AES-256-GCM in this architecture?**
> *Answer*: BCrypt is a slow, salted, one-way hashing function designed to make password brute-force attacks computationally infeasible. It is mathematically irreversible. In contrast, AES-256-GCM is an authenticated symmetric encryption algorithm. Third-party social API credentials (such as OAuth tokens) must be sent to external platforms in plain text, requiring two-way encryption. The GCM mode provides confidentiality while the 128-bit authentication tag guarantees that the cipher has not been tampered with in the database.

**Q3: How does the application avoid N+1 query problems in JPA?**
> *Answer*: Entity relationships (such as `Post.platforms`) use `FetchType.LAZY` by default. In read-heavy queries, Spring Data JPA `@EntityGraph` or custom JPQL with `JOIN FETCH` is utilized to load parent entities and associated collections in a single SQL join query.

**Q4: How does your Canary Deployment ensure zero-downtime rollouts?**
> *Answer*: Nginx sits in front of two backend deployments (`backend-stable` and `backend-canary`) using a weighted upstream block. When a new version is built, it is deployed as the canary container and allocated 10% of incoming traffic. The automated `health-check.sh` script probes Spring Boot Actuator `/actuator/health`. If health checks pass, traffic is progressively increased to 25%, 50%, and 100% using `nginx -s reload`. If errors occur, `canary-rollback.sh` immediately resets canary traffic to 0% without restarting the proxy.

---

## 16. License

This project is licensed under the Apache License 2.0. Developed for academic engineering evaluation and enterprise production reference.
