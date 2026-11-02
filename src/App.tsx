/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store, useAppSelector } from './store';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { ToastContainer } from './components/common/ToastContainer';
import { DashboardView } from './components/dashboard/DashboardView';
import { PostComposer } from './components/composer/PostComposer';
import { ContentCalendar } from './components/calendar/ContentCalendar';
import { DraftManagement } from './components/drafts/DraftManagement';
import { ConnectedAccounts } from './components/platforms/ConnectedAccounts';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { UserManagement } from './components/users/UserManagement';
import { AuditLogViewer } from './components/users/AuditLogViewer';
import { KafkaInspectorModal } from './components/kafka/KafkaInspectorModal';
import { AuthModal } from './components/auth/AuthModal';
import { Draft } from './types';

function MainLayout() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isKafkaModalOpen, setIsKafkaModalOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<Draft | undefined>(undefined);

  // Draft Edit in Composer handler
  const handleEditDraft = (draft: Draft) => {
    setEditingDraft(draft);
    setActiveTab('composer');
  };

  const handleCreateNewDraft = () => {
    setEditingDraft(undefined);
    setActiveTab('composer');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans antialiased">
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Auth Modal if unauthenticated */}
      {!isAuthenticated && <AuthModal />}

      {/* Left Collapsible Dark Navy Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'composer') setEditingDraft(undefined);
          setActiveTab(tab);
        }}
        onOpenKafkaConsole={() => setIsKafkaModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar
          activeTab={activeTab}
          onOpenComposer={() => {
            setEditingDraft(undefined);
            setActiveTab('composer');
          }}
          onOpenKafkaConsole={() => setIsKafkaModalOpen(true)}
        />

        {/* Viewport View Switcher */}
        <main className="flex-1 overflow-y-auto px-6 py-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <DashboardView onNavigate={(tab) => setActiveTab(tab)} />}
          {activeTab === 'composer' && (
            <PostComposer
              initialDraft={editingDraft}
              onPostSuccess={() => {
                setEditingDraft(undefined);
                setActiveTab('dashboard');
              }}
            />
          )}
          {activeTab === 'calendar' && (
            <ContentCalendar
              onScheduleNew={() => {
                setEditingDraft(undefined);
                setActiveTab('composer');
              }}
            />
          )}
          {activeTab === 'drafts' && (
            <DraftManagement
              onEditDraftInComposer={handleEditDraft}
              onCreateNew={handleCreateNewDraft}
            />
          )}
          {activeTab === 'accounts' && <ConnectedAccounts />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'audit' && <AuditLogViewer />}
        </main>
      </div>

      {/* Kafka Inspector Modal */}
      <KafkaInspectorModal isOpen={isKafkaModalOpen} onClose={() => setIsKafkaModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <MainLayout />
    </Provider>
  );
}
