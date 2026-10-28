import React, { useState, useEffect } from 'react';
import { Post, User, SocialPlatform } from './types/index.ts';
import { PostComposer } from './components/PostComposer.tsx';
import { PlatformPreview } from './components/PlatformPreview.tsx';
import { CanaryDashboard } from './components/CanaryDashboard.tsx';
import { CiCdRunner } from './components/CiCdRunner.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import {
  Share2,
  Layers,
  Activity,
  FileText,
  BookOpen,
  User as UserIcon,
  LogIn,
  LogOut,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Terminal,
  Server,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'composer' | 'posts' | 'cicd' | 'canary' | 'docs'>('composer');
  const [previewPlatform, setPreviewPlatform] = useState<SocialPlatform>('twitter');
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>({
    id: 'user-demo-1',
    name: 'DevOps Lead',
    email: 'demo@postcomposer.io',
    role: 'user',
    createdAt: new Date().toISOString(),
  });
  const [token, setToken] = useState<string | null>('demo-jwt-token-active');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [backendHealth, setBackendHealth] = useState<{ status: string; version: string; releaseTrack?: string } | null>(null);

  // Fetch posts and health
  const refreshData = async () => {
    try {
      const [healthRes, postsRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/posts'),
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setBackendHealth(healthData);
      }

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData.posts || []);
      }
    } catch {
      // Backend maybe loading
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleDeletePost = async (id: string) => {
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      // Handle error
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
  };

  const latestPost = posts[0] || {
    text: 'Deploying our multi-platform social media post composer with Vitest CI pipeline and Docker Canary deployment! 🚀 #devops #cicd',
    mediaUrls: ['https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=800&auto=format&fit=crop&q=80'],
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-white">
                  PostPulse
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  CI/CD DevOps Lab
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 hidden sm:block">
                Multi-Platform Social Composer & Automated Canary Deployment
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Live Health Badge */}
            {backendHealth && (
              <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                  {backendHealth.version}
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  {backendHealth.releaseTrack || 'Canary'}
                </span>
              </div>
            )}

            {/* Auth status */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{user.name}</span>
                  <span className="text-[10px] text-zinc-400">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar border-t border-zinc-100 dark:border-zinc-800/60 py-1.5">
          {[
            { id: 'composer', label: 'Composer', icon: Share2 },
            { id: 'posts', label: `Published (${posts.length})`, icon: FileText },
            { id: 'cicd', label: 'CI Pipeline & Contracts', icon: ShieldCheck },
            { id: 'canary', label: 'CD Canary Controller', icon: Activity },
            { id: 'docs', label: 'Lab Guide & CLI', icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: COMPOSER */}
        {activeTab === 'composer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <PostComposer onPostCreated={handlePostCreated} authToken={token} />
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500">
                    Live Feed Preview
                  </h3>
                  <div className="flex gap-1">
                    {(['twitter', 'linkedin', 'facebook', 'instagram'] as SocialPlatform[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPreviewPlatform(p)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          previewPlatform === p
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                            : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                        title={`Preview as ${p}`}
                      >
                        {p === 'twitter' && <Twitter className="w-3.5 h-3.5" />}
                        {p === 'linkedin' && <Linkedin className="w-3.5 h-3.5" />}
                        {p === 'facebook' && <Facebook className="w-3.5 h-3.5" />}
                        {p === 'instagram' && <Instagram className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                <PlatformPreview
                  platform={previewPlatform}
                  text={latestPost.text}
                  mediaUrls={latestPost.mediaUrls || []}
                  userName={user?.name || 'DevOps Engineer'}
                />
              </div>

              {/* CI/CD Quick Stats banner */}
              <div className="p-4 rounded-2xl bg-linear-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/50 dark:border-indigo-900/50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    Continuous Delivery Active
                  </h4>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Unit, integration, and contract tests run automatically on every push.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('cicd')}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 font-semibold text-xs rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 cursor-pointer shrink-0"
                >
                  View Pipeline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: POSTS FEED */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Published & Scheduled Posts</h2>
                <p className="text-xs text-zinc-500">Stored in database across platforms</p>
              </div>
              <button
                onClick={() => setActiveTab('composer')}
                className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
              >
                + New Post
              </button>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <FileText className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No posts published yet</p>
                <p className="text-xs text-zinc-400 mt-1">Use the composer to craft and publish multi-platform posts.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          {post.platforms.map((p) => (
                            <span
                              key={p}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            post.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap mb-3 leading-relaxed">
                        {post.text}
                      </p>

                      {post.mediaUrls && post.mediaUrls.length > 0 && (
                        <div className="rounded-xl overflow-hidden mb-3 border border-zinc-100 dark:border-zinc-800 max-h-48">
                          <img src={post.mediaUrls[0]} alt="Post media" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CI PIPELINE & CONTRACTS */}
        {activeTab === 'cicd' && <CiCdRunner />}

        {/* TAB 4: CANARY DEPLOYMENT CONTROLLER */}
        {activeTab === 'canary' && <CanaryDashboard />}

        {/* TAB 5: LAB GUIDE & COMMANDS */}
        {activeTab === 'docs' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                DevOps Lab Evaluation & CLI Execution Guide
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Complete instructions for reproducing Experiment 1 (CI) and Experiment 2 (CD) locally or in lab evaluations.
              </p>
            </div>

            {/* Experiment 1 Guide */}
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Experiment 1: Continuous Integration (CI)
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Execute unit tests, integration tests, contract tests, and linting suites using the configured npm scripts:
              </p>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-zinc-950 text-zinc-200">
                  <span className="text-emerald-400"># 1. Run all unit tests (character count, limits, emojis, auth)</span>
                  <br />
                  npm run test:unit
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 text-zinc-200">
                  <span className="text-emerald-400"># 2. Run backend Express integration tests (Supertest)</span>
                  <br />
                  npm run test:integration
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 text-zinc-200">
                  <span className="text-emerald-400"># 3. Run Zod API Contract tests</span>
                  <br />
                  npm run test:contracts
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 text-zinc-200">
                  <span className="text-emerald-400"># 4. Run entire test suite across all categories</span>
                  <br />
                  npm test
                </div>
              </div>
            </div>

            {/* Experiment 2 Guide */}
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Experiment 2: Continuous Deployment & Canary Strategy (CD)
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Start local multi-container environment or test the canary traffic routing scripts:
              </p>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-zinc-950 text-zinc-200">
                  <span className="text-emerald-400"># 1. Start standard stack (MongoDB + Backend + Frontend via Nginx)</span>
                  <br />
                  docker compose up --build
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 text-zinc-200">
                  <span className="text-emerald-400"># 2. Start Canary stack (Stable + Canary + Weighted Nginx Proxy)</span>
                  <br />
                  docker compose -f deploy/canary/compose.canary.yaml up --build
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 text-zinc-200">
                  <span className="text-emerald-400"># 3. Test traffic split ratio (sends 100 requests and reports ratio)</span>
                  <br />
                  bash deploy/scripts/test-traffic-split.sh
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 text-zinc-200">
                  <span className="text-emerald-400"># 4. Promote Canary to 25%, 50%, or 100%</span>
                  <br />
                  bash deploy/scripts/canary-promote.sh 25
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 text-zinc-200">
                  <span className="text-emerald-400"># 5. Immediate emergency rollback to 100% stable</span>
                  <br />
                  bash deploy/scripts/canary-rollback.sh
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500">
        <p>PostPulse DevOps Lab · Multi-Platform Post Composer with Full CI/CD Automation</p>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(newToken, newUser) => {
          setToken(newToken);
          setUser(newUser);
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}
