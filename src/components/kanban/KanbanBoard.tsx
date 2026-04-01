
import { useState } from 'react';
import type { Initiative, Stage } from '../../types';
import { STAGES } from '../../data/mockData';
import { Filter } from 'lucide-react';
import KanbanColumn from './KanbanColumn';

interface KanbanBoardProps {
  initiatives: Initiative[];
  onInitiativeClick: (id: string) => void;
  onMoveInitiative: (id: string, newStage: Stage) => void;
  stuckDaysThreshold: number;
}

export default function KanbanBoard({ initiatives, onInitiativeClick, onMoveInitiative, stuckDaysThreshold }: KanbanBoardProps) {
  const [productFilter, setProductFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredInitiatives = initiatives.filter(init => {
    if (productFilter !== 'All' && init.product !== productFilter) return false;
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
      {/* Date Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border text-sm border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-wrap gap-2 shadow-sm items-center shrink-0 mb-4 transition-colors">
        <div className="flex items-center text-slate-500 dark:text-slate-400 mr-2">
          <Filter size={16} className="mr-1.5" />
          <span className="text-sm font-bold tracking-tight uppercase">Filters:</span>
        </div>
        
        <select 
          value={productFilter} 
          onChange={e => setProductFilter(e.target.value)}
          className="w-full sm:w-auto text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-500 bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
        >
          <option value="All">All Products</option>
          <option value="Surbo">Surbo</option>
          <option value="Surbo Chat">Surbo Chat</option>
        </select>
        
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
