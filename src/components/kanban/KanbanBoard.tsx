
import { useState } from 'react';
import type { Initiative, Stage } from '../../types';
import { STAGES, DEVELOPER_TEAMS } from '../../data/mockData';
import { useUsers } from '../../contexts/UserContext';
import { Filter, X } from 'lucide-react';
import KanbanColumn from './KanbanColumn';

interface KanbanBoardProps {
  initiatives: Initiative[];
  onInitiativeClick: (id: string) => void;
  onMoveInitiative: (id: string, newStage: Stage) => void;
  stuckDaysThreshold: number;
}


export default function KanbanBoard({ initiatives, onInitiativeClick, onMoveInitiative, stuckDaysThreshold }: KanbanBoardProps) {
  const { usersList } = useUsers();
  const [productFilter, setProductFilter] = useState<string>('All');
  const [ownerFilter, setOwnerFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [developerFilter, setDeveloperFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const activeFilterCount = [
    productFilter !== 'All' ? 1 : 0,
    ownerFilter !== 'All' ? 1 : 0,
    priorityFilter !== 'All' ? 1 : 0,
    developerFilter !== 'All' ? 1 : 0,
    startDate ? 1 : 0,
    endDate ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAll = () => {
    setProductFilter('All');
    setOwnerFilter('All');
    setPriorityFilter('All');
    setDeveloperFilter('All');
    setStartDate('');
    setEndDate('');
  };

  const filteredInitiatives = initiatives.filter(init => {
    if (productFilter !== 'All' && init.product !== productFilter) return false;
    if (ownerFilter !== 'All' && init.ownerId !== ownerFilter) return false;
    if (priorityFilter !== 'All' && init.priority !== priorityFilter) return false;
    if (developerFilter !== 'All' && !(init.developers || []).includes(developerFilter)) return false;
    if (startDate && new Date(init.createdAt) < new Date(startDate)) return false;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(init.createdAt) > end) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border text-sm border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-wrap gap-2 shadow-sm items-center shrink-0 mb-4 transition-colors">
        <div className="flex items-center text-slate-500 dark:text-slate-400 mr-1">
          <Filter size={16} className="mr-1.5" />
          <span className="text-sm font-bold tracking-tight uppercase">Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
        
        {/* Product */}
        <select 
          value={productFilter} 
          onChange={e => setProductFilter(e.target.value)}
          className="text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-500 bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
        >
          <option value="All">All Products</option>
          <option value="Surbo">Surbo</option>
          <option value="Surbo Chat">Surbo Chat</option>
          <option value="Surbo Ace">Surbo Ace</option>
          <option value="AI Voicebot">AI Voicebot</option>
        </select>

        {/* Owner */}
        <select 
          value={ownerFilter} 
          onChange={e => setOwnerFilter(e.target.value)}
          className="text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-500 bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
        >
          <option value="All">All Owners</option>
          {usersList.map(user => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>

        {/* Priority */}
        <select 
          value={priorityFilter} 
          onChange={e => setPriorityFilter(e.target.value)}
          className="text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-500 bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
        >
          <option value="All">All Priorities</option>
          <option value="High">🔴 High</option>
          <option value="Medium">🟡 Medium</option>
          <option value="Low">🟢 Low</option>
        </select>

        {/* Developer */}
        <select 
          value={developerFilter} 
          onChange={e => setDeveloperFilter(e.target.value)}
          className="text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-500 bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
        >
          <option value="All">All Developers</option>
          {Object.entries(DEVELOPER_TEAMS).map(([team, devs]) => (
            <optgroup key={team} label={team}>
              {devs.map(dev => (
                <option key={dev} value={dev}>{dev}</option>
              ))}
            </optgroup>
          ))}
        </select>
        
        {/* Date Range */}
        <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 overflow-hidden focus-within:ring-1 focus-within:ring-teal-500 focus-within:border-teal-400 transition-all">
          <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">From</span>
          <input 
             type="date"
             value={startDate}
             onChange={e => setStartDate(e.target.value)}
             className="bg-transparent text-sm py-1.5 px-1 outline-none text-slate-700 dark:text-slate-200 font-medium w-32 [color-scheme:light] dark:[color-scheme:dark]"
          />
          <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider ml-1">To</span>
          <input 
             type="date"
             value={endDate}
             onChange={e => setEndDate(e.target.value)}
             className="bg-transparent text-sm py-1.5 px-1 outline-none text-slate-700 dark:text-slate-200 font-medium w-32 [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>

        {/* Clear All */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 transition-all"
          >
            <X size={14} />
            Clear All
          </button>
        )}
      </div>

      {/* Board Columns */}
      <div className="flex-1 w-full flex space-x-4 overflow-x-auto pb-4 custom-scrollbar-x pr-8 min-h-0">
        {STAGES.filter(stage => stage !== 'Roadmap').map((stage) => {
          const columnInitiatives = filteredInitiatives.filter(i => i.stage === stage);
          return (
            <KanbanColumn 
              key={stage} 
              stage={stage} 
              initiatives={columnInitiatives} 
              onInitiativeClick={onInitiativeClick}
              onMoveInitiative={onMoveInitiative}
              stuckDaysThreshold={stuckDaysThreshold}
            />
          );
        })}
      </div>
    </div>
  );
}
