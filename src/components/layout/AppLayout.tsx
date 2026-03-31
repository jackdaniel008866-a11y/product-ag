import React from 'react';
import Header from './Header';
import ViewTabs from './ViewTabs';
import type { AppNotification, Initiative } from '../../types';

type ViewType = 'kanban' | 'roadmap' | 'list' | 'stuck' | 'product' | 'team' | 'insights';

interface AppLayoutProps {
  children: React.ReactNode;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onQuickAdd: () => void;
  onExportData: () => void;
  stuckCount: number;
  initiatives: Initiative[];
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onNotificationClick: (initiativeId: string) => void;
}

export default function AppLayout({ children, currentView, onViewChange, onQuickAdd, onExportData, stuckCount, initiatives, notifications, onMarkNotificationRead, onNotificationClick }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900">
      <Header 
        onQuickAdd={onQuickAdd} 
        onExportData={onExportData}
        initiatives={initiatives}
        notifications={notifications} 
        onMarkRead={onMarkNotificationRead}
        onNotificationClick={onNotificationClick}
      />
      <ViewTabs currentView={currentView} onViewChange={onViewChange} stuckCount={stuckCount} />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-3 md:p-6 scroll-smooth">
        <div className="max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
