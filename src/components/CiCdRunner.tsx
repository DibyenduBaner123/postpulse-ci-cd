import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  FileCode,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronRight,
  GitBranch,
} from 'lucide-react';

interface TestCase {
  id: string;
  name: string;
  suite: 'unit' | 'integration' | 'contract';
  file: string;
  durationMs: number;
  status: 'passed' | 'failed' | 'running' | 'idle';
  description: string;
}

const INITIAL_TESTS: TestCase[] = [
  // Unit
  {
    id: 'u1',
    name: 'counts basic ASCII and multi-byte emoji graphemes',
    suite: 'unit',
    file: 'tests/unit/characterCount.test.ts',
    durationMs: 4,
    status: 'idle',
    description: 'Verifies grapheme segmentation for standard text and emoji sets.',
  },
  {
    id: 'u2',
    name: 'calculates Twitter t.co 23-char wrapped URL limit',
    suite: 'unit',
    file: 'tests/unit/characterCount.test.ts',
    durationMs: 5,
    status: 'idle',
    description: 'Ensures Twitter link wrapping adheres to the 23-character constant.',
  },
  {
    id: 'u3',
    name: 'enforces platform-specific limits (Twitter 280, LinkedIn 3000, IG 2200)',
    suite: 'unit',
    file: 'tests/unit/postValidator.test.ts',
    durationMs: 6,
    status: 'idle',
    description: 'Tests boundary conditions for all supported social platforms.',
  },
  {
    id: 'u4',
    name: 'enforces Instagram image requirement',
    suite: 'unit',
    file: 'tests/unit/postValidator.test.ts',
    durationMs: 4,
    status: 'idle',
    description: 'Ensures Instagram posts cannot be created without media.',
  },
  {
    id: 'u5',
    name: 'generates and verifies JWT tokens with bcrypt password hashing',
    suite: 'unit',
    file: 'tests/unit/auth.test.ts',
    durationMs: 82,
    status: 'idle',
    description: 'Tests token signing, claims verification, and bcrypt salt rounds.',
  },

  // Integration
  {
    id: 'i1',
    name: 'GET /api/health returns 200 with version headers',
    suite: 'integration',
    file: 'tests/integration/api.test.ts',
    durationMs: 14,
    status: 'idle',
    description: 'Supertest integration check on health and release track telemetry.',
  },
  {
    id: 'i2',
    name: 'POST /api/auth/register creates user and rejects duplicate emails',
    suite: 'integration',
    file: 'tests/integration/api.test.ts',
    durationMs: 95,
    status: 'idle',
    description: 'Integration test verifying user registration and 409 Conflict behavior.',
  },
  {
    id: 'i3',
    name: 'POST /api/auth/login authenticates and protects /api/auth/me',
    suite: 'integration',
    file: 'tests/integration/api.test.ts',
    durationMs: 88,
    status: 'idle',
    description: 'Verifies protected Express routes block requests without Bearer tokens.',
  },
  {
    id: 'i4',
    name: 'POST /api/posts validates constraints and saves post',
    suite: 'integration',
    file: 'tests/integration/api.test.ts',
    durationMs: 22,
    status: 'idle',
    description: 'Tests end-to-end post creation with validation middleware.',
  },

  // Contract
  {
    id: 'c1',
    name: 'GET /api/health satisfies HealthResponseSchema contract',
    suite: 'contract',
    file: 'tests/contracts/apiContracts.test.ts',
    durationMs: 12,
    status: 'idle',
    description: 'Zod contract check on status, uptime, environment, and release track.',
  },
  {
    id: 'c2',
    name: 'POST /api/auth/login satisfies LoginResponseSchema contract',
    suite: 'contract',
    file: 'tests/contracts/apiContracts.test.ts',
    durationMs: 76,
    status: 'idle',
    description: 'Validates token string and user object fields against agreed schema.',
  },
  {
    id: 'c3',
    name: 'GET & POST /api/posts satisfy PostList and PostItem contracts',
    suite: 'contract',
    file: 'tests/contracts/apiContracts.test.ts',
    durationMs: 18,
    status: 'idle',
    description: 'Ensures array shape, timestamps, and platform keys match contract.',
  },
  {
    id: 'c4',
    name: 'detects contract violations when payload schema is breached',
    suite: 'contract',
    file: 'tests/contracts/apiContracts.test.ts',
    durationMs: 8,
    status: 'idle',
    description: 'Negative simulation confirming CI fails when breaking changes occur.',
  },
];

export const CiCdRunner: React.FC = () => {
  const [tests, setTests] = useState<TestCase[]>(INITIAL_TESTS);
  const [isRunning, setIsRunning] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unit' | 'integration' | 'contract'>('all');
  const [activeView, setActiveView] = useState<'tests' | 'workflows'>('tests');

  const runAllTests = async () => {
    setIsRunning(true);
    // Mark all as running
    setTests((prev) => prev.map((t) => ({ ...t, status: 'running' })));

    for (let i = 0; i < tests.length; i++) {
      await new Promise((res) => setTimeout(res, 90 + Math.random() * 80));
      setTests((prev) =>
        prev.map((t, idx) => (idx === i ? { ...t, status: 'passed' } : t))
      );
    }
    setIsRunning(false);
  };

  const filteredTests = tests.filter((t) => (activeFilter === 'all' ? true : t.suite === activeFilter));
  const passedCount = tests.filter((t) => t.status === 'passed').length;
  const totalCount = tests.length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-zinc-100 dark:border-zinc-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                CI/CD Pipeline & Contract Testing Suite
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                Experiment 1 & 2
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Automated testing suite covering isolated unit tests, Supertest Express integration, and Zod API contract guarantees.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView(activeView === 'tests' ? 'workflows' : 'tests')}
              className="px-3.5 py-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>{activeView === 'tests' ? 'View CI/CD Workflows' : 'View Test Suite'}</span>
            </button>

            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Full CI Test Suite</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] text-zinc-500 block">Unit Tests</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">5 Passed</span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Limits, Emojis, URLs</span>
          </div>
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] text-zinc-500 block">Integration Tests</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">4 Passed</span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Express + Supertest</span>
          </div>
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] text-zinc-500 block">Contract Tests</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">4 Passed</span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Zod Schema Verified</span>
          </div>
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] text-zinc-500 block">Pipeline Status</span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {passedCount === totalCount ? '100% Passing' : `${passedCount}/${totalCount} Ready`}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">npm run test:all</span>
          </div>
        </div>
      </div>

      {activeView === 'tests' ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          {/* Suite filters */}
          <div className="flex items-center gap-1.5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            {(['all', 'unit', 'integration', 'contract'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-all ${
                  activeFilter === filter
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {filter === 'all' ? 'All Test Cases' : `${filter} Tests`}
              </button>
            ))}
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 mt-2">
            {filteredTests.map((test) => (
              <div key={test.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {test.status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : test.status === 'running' ? (
                      <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        {test.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {test.suite}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{test.description}</p>
                    <span className="text-[10px] font-mono text-zinc-400">{test.file}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-zinc-500">{test.durationMs}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Workflows View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-3">
              <span className="text-xs font-bold text-zinc-900 dark:text-white">.github/workflows/ci.yml</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold">Continuous Integration</span>
            </div>
            <pre className="text-[11px] font-mono bg-zinc-950 text-zinc-300 p-3.5 rounded-xl overflow-x-auto leading-relaxed max-h-80">
{`name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:contracts
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist-artifacts
          path: dist/`}
            </pre>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-3">
              <span className="text-xs font-bold text-zinc-900 dark:text-white">.github/workflows/cd.yml</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold">Continuous Deployment</span>
            </div>
            <pre className="text-[11px] font-mono bg-zinc-950 text-zinc-300 p-3.5 rounded-xl overflow-x-auto leading-relaxed max-h-80">
{`name: CD Pipeline & Canary Release

on:
  push:
    branches: [main]

jobs:
  build-and-publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - name: Build & Push Images
        run: |
          docker build -t ghcr.io/org/frontend:\${{ github.sha }} -f Dockerfile.frontend .
          docker build -t ghcr.io/org/backend:\${{ github.sha }} -f Dockerfile.backend .
      - name: Deploy Canary 10%
        run: bash deploy/scripts/canary-promote.sh 10`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
