import { LayoutDashboard, List, AlertOctagon, Layers, Map, LineChart, type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

type ViewType = 'kanban' | 'roadmap' | 'list' | 'stuck' | 'product' | 'team' | 'insights';

interface ViewTabsProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  stuckCount: number;
}

const TABS: Array<{id: string, label: string, icon: LucideIcon}> = [
  { id: 'kanban', label: 'Kanban', icon: LayoutDashboard },
  { id: 'roadmap', label: 'Roadmap', icon: Map },
  { id: 'list', label: 'List View', icon: List },
  { id: 'stuck', label: "What's Stuck", icon: AlertOctagon },
  { id: 'product', label: 'Product Focus', icon: Layers },
  { id: 'insights', label: 'Direction Insights', icon: LineChart },
];

export default function ViewTabs({ currentView, onViewChange, stuckCount }: ViewTabsProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 pt-2 transition-colors">
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
  );
}
