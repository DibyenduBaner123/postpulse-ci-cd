# PostPulse: Multi-Platform Post Composer & CI/CD Pipeline

A modern, production-grade DevOps engineering project implementing **Continuous Integration (CI)** and **Continuous Deployment (CD) with Canary Releases** for a Multi-Platform Social Media Post Composer (supporting Twitter/X, LinkedIn, Facebook, and Instagram).

Built with **React 19 + Vite**, **Node.js/Express**, **TypeScript**, **Vitest**, **Supertest**, **Zod Contract Testing**, **Docker**, **Nginx**, and **GitHub Actions**.

---

## 📑 Table of Contents
1. [Architecture & Project Structure](#architecture--project-structure)
2. [Experiment 1: Continuous Integration (CI)](#experiment-1-continuous-integration-ci)
   - [Objectives & Concepts](#objectives--concepts)
   - [Unit Testing Suite](#unit-testing-suite)
   - [Integration Testing Suite](#integration-testing-suite)
   - [API Contract Testing](#api-contract-testing)
   - [Running CI Tests Locally](#running-ci-tests-locally)
   - [GitHub Actions CI Workflow](#github-actions-ci-workflow)
3. [Experiment 2: Continuous Deployment (CD)](#experiment-2-continuous-deployment-cd)
   - [Containerization Strategy (Docker)](#containerization-strategy-docker)
   - [Local Multi-Container Stack (Docker Compose)](#local-multi-container-stack-docker-compose)
   - [Canary Release Architecture](#canary-release-architecture)
   - [Traffic Promotion & Emergency Rollback](#traffic-promotion--emergency-rollback)
   - [GitHub Actions CD Workflow & GHCR](#github-actions-cd-workflow--ghcr)
4. [Lab Evaluation & Demonstration Guide](#lab-evaluation--demonstration-guide)
   - [Demonstrating Experiment 1 (CI)](#demonstrating-experiment-1-ci)
   - [Demonstrating Experiment 2 (CD & Canary)](#demonstrating-experiment-2-cd--canary)
5. [Troubleshooting Guide](#troubleshooting-guide)

---

## Architecture & Project Structure

```
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Continuous Integration workflow (lint, unit, integration, contract, build)
│       └── cd.yml                     # Continuous Deployment workflow (GHCR publish, staging, canary deployment)
├── deploy/
│   ├── canary/
│   │   ├── compose.canary.yaml        # Canary stack (stable, canary, weighted Nginx proxy, mongodb)
│   │   └── nginx.canary.conf          # Nginx weighted upstream proxy configuration
│   ├── nginx/
│   │   └── nginx.conf                 # Production Nginx reverse-proxy configuration
│   └── scripts/
│       ├── canary-promote.sh          # Automated canary traffic promotion script (10% -> 25% -> 50% -> 100%)
│       ├── canary-rollback.sh         # Emergency 0% traffic rollback script
│       ├── health-check.sh            # Automated service health-check polling script
│       └── test-traffic-split.sh      # Traffic ratio verification test script
├── src/
│   ├── components/
│   │   ├── AuthModal.tsx              # JWT authentication modal (Login/Register/Demo user)
│   │   ├── CanaryDashboard.tsx        # Interactive Canary topology & rollback simulator
│   │   ├── CiCdRunner.tsx             # Interactive CI test suite inspector & runner
│   │   ├── PlatformPreview.tsx        # Real-time Twitter, LinkedIn, Instagram, Facebook preview cards
│   │   └── PostComposer.tsx           # Multi-platform composer with live character counts & media validation
│   ├── contracts/
│   │   └── schemas.ts                 # Zod API contract schemas (request & response contracts)
│   ├── server/
│   │   ├── app.ts                     # Express API application & route definitions
│   │   └── db.ts                      # Repository store & Canary metrics engine
│   ├── types/
│   │   └── index.ts                   # Core domain types, platform limits, and user models
│   ├── utils/
│   │   ├── auth.ts                    # JWT token signing, verification & bcrypt hashing
│   │   ├── characterCount.ts          # Grapheme counting, Twitter t.co 23-char URL wrapping & hashtags
│   │   └── postValidator.ts           # Platform constraint validations (char limits, media requirements)
│   ├── App.tsx                        # Main dashboard UI
│   ├── index.css                      # Tailwind CSS v4 styling
│   └── main.tsx                       # React application entrypoint
├── tests/
│   ├── contracts/
│   │   └── apiContracts.test.ts       # Zod contract tests verifying agreed API schemas & break detection
│   ├── frontend/
│   │   ├── Auth.test.tsx              # RTL tests for authentication modal & state
│   │   └── Composer.test.tsx          # RTL tests for platform toggles, live counters & validation
│   ├── integration/
│   │   └── api.test.ts                # Supertest integration tests for all Express endpoints
│   ├── unit/
│   │   ├── auth.test.ts               # Unit tests for JWT & password hashing
│   │   ├── characterCount.test.ts     # Unit tests for character counting, emojis & Twitter URL wrapping
│   │   └── postValidator.test.ts      # Unit tests for platform constraints & media validation
│   └── setup.ts                       # Vitest test setup & DOM cleanup
├── compose.yaml                       # Local Docker Compose setup (MongoDB + Backend + Frontend)
├── Dockerfile.backend                 # Multi-stage Dockerfile for Node.js Express backend (non-root)
├── Dockerfile.frontend                # Multi-stage Dockerfile for Vite React + Nginx
├── .dockerignore                      # Docker ignore rules
├── package.json                       # Scripts and dependencies
├── server.ts                          # Full-stack dev & production server entry point
├── vitest.config.ts                   # Vitest testing configuration
└── README.md                          # Documentation & lab guide
```

---

## Experiment 1: Continuous Integration (CI)

### Objectives & Concepts
Continuous Integration (CI) is a software engineering practice where code changes are automatically tested and validated early and often. In this project, the CI pipeline ensures:
1. **Zero Regression**: Every pull request is verified against isolated unit tests, integration tests, and frontend UI tests.
2. **Contract Fidelity**: Microservices and clients communicate via explicit API contracts (defined using **Zod**). Breaking schema changes fail the build before deployment.
3. **Artifact Generation**: Verified code produces optimized, production-ready static assets.

### Unit Testing Suite
Located in `tests/unit/`:
- **`characterCount.test.ts`**:
  - Validates unicode grapheme counting for emojis (e.g. 🚀🎉🔥 counted as 1 grapheme each).
  - Validates Twitter's `t.co` URL auto-wrapping constraint (all URLs count as 23 characters regardless of length).
  - Tests hashtag extraction and boundary calculations.
- **`postValidator.test.ts`**:
  - Tests character limits per platform (Twitter: 280, LinkedIn: 3000, Facebook: 5000, Instagram: 2200).
  - Enforces Instagram's mandatory media rule (must have $\ge 1$ image/video).
  - Validates media MIME types (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) and 5MB size limits.
  - Tests scheduled date validation (must be in the future).
- **`auth.test.ts`**:
  - Validates JWT token generation, payload decoding, and signature tampering detection.
  - Tests `Bearer` authorization header parsing and bcrypt password hashing.

### Integration Testing Suite
Located in `tests/integration/`:
- **`api.test.ts`**:
  - Uses **Supertest** to test Express routes without spinning up unnecessary ports.
  - Tests `GET /api/health`: 200 OK, version telemetry, and release tracking.
  - Tests `POST /api/auth/register`: 201 Created, duplicate email rejection (409 Conflict), and input validation (400 Bad Request).
  - Tests `POST /api/auth/login`: 200 OK with valid credentials, 401 Unauthorized with bad passwords.
  - Tests protected endpoint `/api/auth/me` with and without Bearer tokens.
  - Tests `POST /api/posts`: validates platform rules and persists posts.

### API Contract Testing
Located in `tests/contracts/`:
- **`apiContracts.test.ts`**:
  - Validates responses from `GET /api/health`, `POST /api/auth/login`, `GET /api/posts`, and `POST /api/posts` against strict **Zod** schemas.
  - **Negative Contract Breaker Simulation**: Demonstrates that if an API response omits a required field, changes a type, or introduces an invalid status, the contract test immediately catches the regression and fails the pipeline.

### Running CI Tests Locally
You can run any test suite using the configured npm scripts:

```bash
# Run all test suites (unit, integration, contracts, frontend)
npm test

# Run isolated unit tests
npm run test:unit

# Run Express backend integration tests
npm run test:backend

# Run frontend React Testing Library tests
npm run test:frontend

# Run API contract schema tests
npm run test:contracts

# Run TypeScript typecheck / lint
npm run lint

# Build production bundle
npm run build
```

### GitHub Actions CI Workflow
Located in `.github/workflows/ci.yml`:
1. **Trigger**: Activates on every `push` and `pull_request` to `main` and `develop`.
2. **Matrix Jobs**:
   - `lint-and-typecheck`: Validates TypeScript without emitting code (`npm run lint`).
   - `unit-tests`: Executes `npm run test:unit`.
   - `integration-tests`: Executes `npm run test:frontend` and `npm run test:backend`.
   - `contract-tests`: Executes `npm run test:contracts`.
   - `build`: Runs `npm run build` after all test jobs pass and uploads the production bundle artifact (`dist/`).
3. **Fail-Fast**: If any test or contract assertion fails, the workflow terminates and blocks the pull request.

---

## Experiment 2: Continuous Deployment (CD)

### Containerization Strategy (Docker)
1. **Frontend (`Dockerfile.frontend`)**:
   - **Multi-stage build**:
     - *Stage 1 (Builder)*: Node.js 22 Alpine installs dependencies with `npm ci` and compiles the Vite production bundle into `/app/dist`.
     - *Stage 2 (Runtime)*: Unprivileged Nginx 1.27 Alpine serves the static assets with Gzip compression and proxies `/api/*` traffic to the backend.
   - Includes container health checks (`wget --spider http://localhost:80/`).
2. **Backend (`Dockerfile.backend`)**:
   - Multi-stage Node.js 22 Alpine image.
   - Runs as non-root user `node` for defense-in-depth container security.
   - Includes container health checks (`curl -f http://localhost:3000/api/health`).

### Local Multi-Container Stack (Docker Compose)
Start the entire local production stack with a single command:

```bash
docker compose up --build
```

**Services Launched:**
- `mongodb`: MongoDB 7.0 with persistent storage volume (`mongodb_data`).
- `backend`: Express application running on port 3000 with healthcheck.
- `frontend`: Nginx web server on port 8080 routing user requests and proxying API calls.

### Canary Release Architecture
Canary deployments deploy a new version alongside the current stable version, routing a small fraction of real traffic (e.g. 10%) to the canary before promoting it to 100%.

Located in `deploy/canary/`:
- **`compose.canary.yaml`**:
  - `backend-stable`: Production Stable release (v1.0.0).
  - `backend-canary`: Release candidate (v1.1.0-canary).
  - `canary-router`: Nginx reverse proxy routing traffic according to weighted upstream parameters.
- **`nginx.canary.conf`**:
  - Uses weighted upstream load-balancing:
    ```nginx
    upstream postpulse_backend {
        server backend-stable:3000 weight=90 max_fails=3 fail_timeout=10s;
        server backend-canary:3000 weight=10 max_fails=3 fail_timeout=10s;
    }
    ```
  - Appends `X-Release-Track` and `X-Upstream-Backend` response headers to make routing observable.

### Traffic Promotion & Emergency Rollback
Automated scripts are located in `deploy/scripts/`:

1. **Start Canary Topology**:
   ```bash
   docker compose -f deploy/canary/compose.canary.yaml up --build -d
   ```

2. **Verify Initial 10% Split**:
   ```bash
   bash deploy/scripts/test-traffic-split.sh http://localhost:8080/api/health 100
   ```

3. **Promote Traffic to 25%, 50%, or 100%**:
   ```bash
   # Promote to Stage 2 (25% Canary / 75% Stable)
   bash deploy/scripts/canary-promote.sh 25

   # Promote to 50%
   bash deploy/scripts/canary-promote.sh 50

   # Promote to 100% (Full Release)
   bash deploy/scripts/canary-promote.sh 100
   ```

4. **Automated / Emergency Rollback**:
   If error rates spike above 5% or health checks fail:
   ```bash
   bash deploy/scripts/canary-rollback.sh "Error rate spike above threshold"
   ```
   *Instantly sets canary weight to 0% and reloads Nginx with zero downtime.*

---

## Lab Evaluation & Demonstration Guide

### Demonstrating Experiment 1 (CI)

#### Step 1: Run All Tests Locally
```bash
npm test
```
**Expected Terminal Output:**
```
 ✓ tests/unit/characterCount.test.ts (7 tests)
 ✓ tests/unit/postValidator.test.ts (9 tests)
 ✓ tests/unit/auth.test.ts (5 tests)
 ✓ tests/frontend/Composer.test.tsx (5 tests)
 ✓ tests/frontend/Auth.test.tsx (3 tests)
 ✓ tests/integration/api.test.ts (11 tests)
 ✓ tests/contracts/apiContracts.test.ts (7 tests)

 Test Files  7 passed (7)
      Tests  47 passed (47)
   Duration  1.42s
```

#### Step 2: Demonstrate Contract Testing & Schema Break Detection
```bash
npm run test:contracts
```
**Expected Terminal Output:**
```
 ✓ Contract: API Schema & Contract Testing
   ✓ GET /api/health satisfies HealthResponseSchema contract
   ✓ POST /api/auth/login satisfies LoginResponseSchema contract
   ✓ POST /api/auth/register satisfies RegisterResponseSchema contract
   ✓ GET /api/posts satisfies PostListResponseSchema contract
   ✓ POST /api/posts satisfies PostItemSchema contract
   ✓ GET /api/canary/status satisfies CanaryStatusResponseSchema contract
   ✓ detects contract violations when backend payload violates schema
```

---

### Demonstrating Experiment 2 (CD & Canary)

#### Step 1: Start Canary Cluster
```bash
docker compose -f deploy/canary/compose.canary.yaml up --build -d
```

#### Step 2: Inspect Canary Traffic Distribution (100 Requests Sample)
```bash
bash deploy/scripts/test-traffic-split.sh http://localhost:8080/api/health 100
```
**Expected Terminal Output:**
```
==========================================================
📊 PostPulse Traffic Split Verification Test
Target: http://localhost:8080/api/health
Sampling 100 requests...
==========================================================
SSSSSSSSSCSSSSSSSSSSSSSSSSSSCSSSSSSSSSSSSSSSSSSSSSS [50/100]
SSSSSSSSSSSSCSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSCSSSSSSSS [100/100]

==========================================================
📈 Sampling Results Breakdown:
Stable Track (v1.0.0):  90 requests (90%)
Canary Track (v1.1.0):  10 requests (10%)
==========================================================
```

#### Step 3: Promote Traffic to 25%
```bash
bash deploy/scripts/canary-promote.sh 25
```
**Expected Output:**
```
🔍 Step 1: Performing health verification on candidate canary...
✓ Canary container is HEALTHY (HTTP 200).
⚙ Step 2: Updating Nginx upstream weights (Stable: 75%, Canary: 25%)...
🔄 Reloading Nginx configuration inside canary-router with zero downtime...
✓ Nginx reloaded successfully.
🎉 Canary Promotion Complete!
Active Traffic Distribution: 75% Stable / 25% Canary
```

#### Step 4: Trigger Emergency Rollback
```bash
bash deploy/scripts/canary-rollback.sh "Synthetic error spike"
```
**Expected Output:**
```
🚨 PostPulse Emergency Rollback Triggered!
Reason: Synthetic error spike
⚙ Reverting Nginx weights to 100% Stable (backend-stable:3000)...
🔄 Applying emergency reload to Nginx router container...
✓ Nginx router reloaded.
🛡 Rollback Complete: 100% of incoming traffic is now routed to Stable v1.0.0.
```

---

## Troubleshooting Guide

### 1. Docker Daemon / Port Conflicts
- **Symptom**: `bind: address already in use: 0.0.0.0:8080` or `0.0.0.0:3000`.
- **Solution**: Check existing processes on the port:
  ```bash
  lsof -i :8080 -i :3000
  kill -9 <PID>
  ```
  Or change the host port mapping in `compose.yaml` (e.g., `"8081:80"`).

### 2. MongoDB Replica Set / Connection Warnings
- **Symptom**: `MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`.
- **Solution**: PostPulse includes an automatic in-memory fallback database when MongoDB is not running locally. In Docker, ensure the `mongodb` service healthcheck passes before backend connects (`depends_on: { mongodb: { condition: service_healthy } }`).

### 3. GitHub Container Registry (GHCR) Permissions
- **Symptom**: `denied: installation not allowed to Write organization package`.
- **Solution**: Ensure your GitHub Actions workflow sets:
  ```yaml
  permissions:
    contents: read
    packages: write
  ```
  In repository settings, navigate to **Settings > Actions > General > Workflow permissions** and select **Read and write permissions**.

### 4. Nginx Reload Signals in Docker
- **Symptom**: `nginx: [error] open() "/var/run/nginx.pid" failed (2: No such file or directory)`.
- **Solution**: The promotion script checks if the master process exists and runs `docker exec canary-router nginx -s reload`. If the container restarted, run `docker compose -f deploy/canary/compose.canary.yaml restart canary-router`.
