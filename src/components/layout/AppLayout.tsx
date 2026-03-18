import React from 'react';
import Header from './Header';
import ViewTabs from './ViewTabs';

type ViewType = 'kanban' | 'roadmap' | 'list' | 'stuck' | 'owner' | 'product' | 'team';

interface AppLayoutProps {
  children: React.ReactNode;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onQuickAdd: () => void;
  stuckCount: number;
}

export default function AppLayout({ children, currentView, onViewChange, onQuickAdd, stuckCount }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900">
      <Header onQuickAdd={onQuickAdd} />
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
