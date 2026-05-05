import { useState } from 'react';
import { LayoutDashboard, List, AlertOctagon, Layers, Map, LineChart, Briefcase, FileText, User, MoreHorizontal, X, type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

type ViewType = 'kanban' | 'roadmap' | 'list' | 'stuck' | 'product' | 'team' | 'insights' | 'client-updates' | 'digest' | 'my-space';

interface ViewTabsProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  stuckCount: number;
}

const TABS: Array<{id: string, label: string, icon: LucideIcon}> = [
  { id: 'kanban', label: 'Kanban', icon: LayoutDashboard },
  { id: 'my-space', label: 'My Space', icon: User },
  { id: 'roadmap', label: 'Roadmap', icon: Map },
  { id: 'list', label: 'List View', icon: List },
  { id: 'client-updates', label: 'Client Updates', icon: Briefcase },
  { id: 'stuck', label: "What's Stuck", icon: AlertOctagon },
  { id: 'product', label: 'Product Focus', icon: Layers },
  { id: 'insights', label: 'Direction Insights', icon: LineChart },
  { id: 'digest', label: 'Digest Helper', icon: FileText },
];

const BOTTOM_TABS = ['kanban', 'my-space', 'roadmap', 'list'];

export default function ViewTabs({ currentView, onViewChange, stuckCount }: ViewTabsProps) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const handleTabClick = (id: ViewType) => {
    onViewChange(id);
    setIsMoreMenuOpen(false);
  };

  const isMoreTabActive = !BOTTOM_TABS.includes(currentView);

  return (
    <>
      {/* DESKTOP/TABLET: Top Horizontal Scroll Tabs */}
      <div className="hidden md:block bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 pt-2 transition-colors">
        <div className="flex space-x-4 md:space-x-8 overflow-x-auto custom-scrollbar-x hide-scrollbar whitespace-nowrap">
          {TABS.map((tab) => {
            const isActive = currentView === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id as ViewType)}
                className={clsx(
                  'group flex items-center space-x-2 pb-2.5 px-1 border-b-2 text-sm font-medium transition-colors relative',
                  isActive 
                    ? 'border-teal-500 text-teal-600 dark:text-teal-400' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                <Icon size={16} className={clsx('transition-colors', isActive ? 'text-teal-500 dark:text-teal-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300')} />
                <span>{tab.label}</span>
                {tab.id === 'stuck' && stuckCount > 0 && (
                  <span className="ml-1.5 flex h-4.5 items-center rounded-full bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 border border-transparent dark:border-red-900/50">
                    {stuckCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MOBILE: Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50 px-2 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center h-16">
          {TABS.filter(t => BOTTOM_TABS.includes(t.id)).map((tab) => {
            const isActive = currentView === tab.id && !isMoreMenuOpen;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id as ViewType)}
                className={clsx(
                  'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                  isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
                )}
              >
                <Icon size={20} className={isActive ? 'animate-in zoom-in duration-200' : ''} />
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              </button>
            );
          })}
          
          {/* MORE BUTTON */}
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={clsx(
              'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative',
              (isMoreMenuOpen || isMoreTabActive) ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
            )}
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-medium leading-none">More</span>
            {/* Show badge if stuck count exists and 'stuck' is under More */}
            {stuckCount > 0 && currentView !== 'stuck' && !isMoreMenuOpen && (
              <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE: "More" Slide-up Menu */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute bottom-16 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-2xl shadow-xl animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">More Tools</h3>
              <button onClick={() => setIsMoreMenuOpen(false)} className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                <X size={18} />
              </button>
            </div>
            <div className="p-2 grid grid-cols-1 gap-1 max-h-[60vh] overflow-y-auto">
              {TABS.filter(t => !BOTTOM_TABS.includes(t.id)).map((tab) => {
                const isActive = currentView === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id as ViewType)}
                    className={clsx(
                      'flex items-center w-full p-4 rounded-xl transition-colors text-left space-x-3',
                      isActive 
                        ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' 
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    <div className={clsx(
                      'p-2 rounded-lg',
                      isActive ? 'bg-teal-100 dark:bg-teal-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    )}>
                      <Icon size={18} />
                    </div>
                    <span className="font-medium flex-1">{tab.label}</span>
                    
                    {tab.id === 'stuck' && stuckCount > 0 && (
                      <span className="flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">
                        {stuckCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
