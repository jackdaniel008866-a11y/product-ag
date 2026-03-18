
import { LayoutDashboard, List, AlertOctagon, User, Layers, Users, Map, type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

type ViewType = 'kanban' | 'roadmap' | 'list' | 'stuck' | 'owner' | 'product' | 'team';

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
  { id: 'owner', label: 'Work by Member', icon: User },
  { id: 'product', label: 'Product Focus', icon: Layers },
  { id: 'team', label: 'Manage Team', icon: Users },
];

export default function ViewTabs({ currentView, onViewChange, stuckCount }: ViewTabsProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-4 md:px-6 pt-2">
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
                  ? 'border-teal-500 text-teal-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              )}
            >
              <Icon size={16} className={clsx('transition-colors', isActive ? 'text-teal-500' : 'text-slate-400 group-hover:text-slate-600')} />
              <span>{tab.label}</span>
              {tab.id === 'stuck' && stuckCount > 0 && (
                <span className="ml-1.5 flex h-4.5 items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
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
