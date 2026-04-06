
import { useState } from 'react';
import type { Initiative } from '../../types';
import { useUsers } from '../../contexts/UserContext';
import { format } from 'date-fns';
import { STAGES, DEVELOPER_TEAMS } from '../../data/mockData';
import { clsx } from 'clsx';
import { Filter } from 'lucide-react';

interface ListViewProps {
  initiatives: Initiative[];
  onInitiativeClick: (id: string) => void;
}

export default function ListView({ initiatives, onInitiativeClick }: ListViewProps) {
  const { users, usersList } = useUsers();
  
  const [productFilter, setProductFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [developerFilter, setDeveloperFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredInitiatives = initiatives.filter(init => {
    if (productFilter !== 'All' && init.product !== productFilter) return false;
    if (stageFilter !== 'All' && init.stage !== stageFilter) return false;
    
    // Date Range Logic
    if (startDate && new Date(init.createdAt) < new Date(startDate)) return false;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(init.createdAt) > end) return false;
    }
    if (priorityFilter !== 'All' && init.priority !== priorityFilter) return false;
    if (statusFilter !== 'All' && init.status !== statusFilter) return false;
    
    if (ownerFilter !== 'All') {
      if (ownerFilter === 'Unassigned') {
        if (init.ownerId && users[init.ownerId]) return false;
      } else {
        if (init.ownerId !== ownerFilter) return false;
      }
    }
    
    if (developerFilter !== 'All') {
      if (developerFilter === 'Unassigned') {
        if (init.developers && init.developers.length > 0) return false;
      } else {
        if (!init.developers || !init.developers.includes(developerFilter)) return false;
      }
    }
    
    return true;
  });

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-300">
      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-wrap gap-2 md:gap-4 shadow-sm items-center shrink-0 transition-colors">
        <div className="flex items-center text-slate-500 dark:text-slate-400 mr-2 w-full sm:w-auto mb-2 sm:mb-0">
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

        <select 
          value={stageFilter} 
          onChange={e => setStageFilter(e.target.value)}
          className="w-full sm:w-auto text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-500 bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
        >
          <option value="All">All Phases</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select 
          value={priorityFilter} 
          onChange={e => setPriorityFilter(e.target.value)}
          className="w-full sm:w-auto text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-500 bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
        >
          <option value="All">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select 
          value={ownerFilter} 
          onChange={e => setOwnerFilter(e.target.value)}
          className="w-full sm:w-auto text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-500 bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
        >
          <option value="All">All Owners</option>
          <option value="Unassigned">Unassigned</option>
          {usersList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        <select 
          value={developerFilter} 
          onChange={e => setDeveloperFilter(e.target.value)}
          className="w-full sm:w-auto text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-500 bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
        >
          <option value="All">All Developers</option>
          <option value="Unassigned">No Developers</option>
          {Object.entries(DEVELOPER_TEAMS).map(([team, devs]) => (
            <optgroup key={team} label={team} className="font-bold text-slate-500 dark:text-slate-400">
              {devs.map(dev => <option key={dev} value={dev} className="font-medium text-slate-700 dark:text-slate-200">{dev}</option>)}
            </optgroup>
          ))}
        </select>

        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-500 bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Blocked">Blocked</option>
          <option value="Parked">Parked</option>
          <option value="Deployed">Deployed</option>
        </select>
        
        <div className="flex items-center space-x-1 w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 overflow-hidden focus-within:ring-1 focus-within:ring-teal-500 focus-within:border-teal-400 transition-all">
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

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border text-sm box-border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0 transition-colors">
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              <th className="px-5 py-3 font-semibold w-[28%]">Initiative</th>
              <th className="px-5 py-3 font-semibold">Stage</th>
              <th className="px-5 py-3 font-semibold">Priority</th>
              <th className="px-5 py-3 font-semibold">Owner</th>
              <th className="px-5 py-3 font-semibold w-[15%]">Developers</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Created</th>
              <th className="px-5 py-3 font-semibold">Target Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredInitiatives.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <div className="text-slate-400 dark:text-slate-600 mb-2">
                    <Filter size={24} className="mx-auto opacity-50" />
                  </div>
                  <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No initiatives found</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try adjusting your filters to see more results.</p>
                </td>
              </tr>
            ) : (
              filteredInitiatives.map((init) => (
                <tr key={init.id} onClick={() => onInitiativeClick(init.id)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                  <td className="px-5 py-3.5 flex flex-col justify-center min-w-[250px]">
                    <span className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">{init.title}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mt-1">{init.product} • {init.type}</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 block w-max font-medium text-xs">
                      {init.stage}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={clsx(
                      "font-semibold text-xs px-2 py-1 rounded-full border",
                      init.priority === 'High' ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50' : 
                      init.priority === 'Medium' ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50' : 
                      'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-900/50'
                    )}>
                      {init.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-white dark:border-slate-800 shadow-sm shrink-0">
                        {users[init.ownerId]?.initials || '??'}
                      </div>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{users[init.ownerId]?.name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                      {!init.developers || init.developers.length === 0 ? (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">None</span>
                      ) : (
                        init.developers.map((dev, idx) => (
                          <span key={idx} className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm truncate max-w-[120px]" title={dev}>
                            {dev}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-1.5 pr-2 py-0.5 rounded-full w-max shadow-sm">
                      <span className={clsx(
                        "w-2 h-2 rounded-full",
                        init.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]' : 
                        init.status === 'Blocked' ? 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.4)]' : 
                        init.status === 'Deployed' ? 'bg-emerald-500' :
                        'bg-slate-400 dark:bg-slate-500'
                      )}></span>
                      <span className="text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">{init.status}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm font-medium whitespace-nowrap">
                    {format(new Date(init.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 text-sm font-medium whitespace-nowrap">
                    {init.targetDate ? format(new Date(init.targetDate), 'MMM d, yyyy') : <span className="text-slate-300 dark:text-slate-600">-</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}
