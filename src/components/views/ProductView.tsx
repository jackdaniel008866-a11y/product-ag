import { useState } from 'react';
import type { Initiative, Stage } from '../../types';
import { differenceInDays } from 'date-fns';
import { STAGES, DEVELOPER_TEAMS } from '../../data/mockData';

interface ProductViewProps {
  initiatives: Initiative[];
}

export default function ProductView({ initiatives }: ProductViewProps) {
  const [timeFilterDays, setTimeFilterDays] = useState<number>(30);

  // Filter initiatives by updatedAt being within the selected timeframe (or all if 0)
  const filteredInitiatives = timeFilterDays === 0 
    ? initiatives 
    : initiatives.filter(i => differenceInDays(new Date(), new Date(i.updatedAt)) <= timeFilterDays);

  const surbo = filteredInitiatives.filter(i => i.product === 'Surbo');
  const surboChat = filteredInitiatives.filter(i => i.product === 'Surbo Chat');

  const renderStats = (title: string, data: Initiative[], badgeColor: string) => {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full max-h-[80vh] transition-colors">
        <div className={`p-3 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between shadow-sm shrink-0 ${badgeColor}`}>
          <h3 className="font-bold text-base truncate pr-2">{title}</h3>
          <span className="font-semibold bg-white/40 dark:bg-black/20 text-slate-800 dark:text-white px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider shadow-sm border border-white/20 dark:border-white/10 shrink-0">{data.length} Tickets</span>
        </div>
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
          <div className="space-y-4">
            {STAGES.map(stage => {
              const items = data.filter(i => i.stage === stage);
              const percentage = data.length ? (items.length / data.length) * 100 : 0;
              
              const colorClass = stage === 'Roadmap' ? 'bg-purple-500' :
                                 stage === 'Planning' ? 'bg-blue-500' :
                                 stage === 'Execution' ? 'bg-amber-500' :
                                 stage === 'Testing' ? 'bg-orange-500' :
                                 stage === 'Deployed' ? 'bg-emerald-500' : 'bg-slate-400';

              if (data.length === 0) return null;

              return (
                <div key={stage} className="animate-in fade-in duration-300">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wide text-[11px]">{stage}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{items.length}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div className={`${colorClass} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}

            
            {data.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm font-medium">
                No initiatives moved within this timeframe.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Product Focus Breakdown</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">High-level distribution of initiatives actively moved within this timeframe.</p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 self-start md:self-auto overflow-x-auto hide-scrollbar">
          {[1, 7, 15, 30, 45, 60, 90, 0].map(days => (
            <button
              key={days}
              onClick={() => setTimeFilterDays(days)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                timeFilterDays === days 
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-400 shadow-sm border border-slate-200 dark:border-slate-600' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              {days === 0 ? 'All Time' : `${days} Days`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderStats('Surbo', surbo, 'bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-400 border-teal-100 dark:border-teal-900/50')}
        {renderStats('Surbo Chat', surboChat, 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-100 dark:border-blue-900/50')}
      </div>

      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Developer Bandwidth</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Ticket stage distribution currently assigned to specific engineering resources.</p>
        </div>

        <div className="space-y-8">
          {Object.entries(DEVELOPER_TEAMS).map(([team, devs]) => {
            return (
              <div key={team}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 ml-1">{team}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {devs.map(dev => {
                    const devInitiatives = filteredInitiatives.filter(i => i.developers?.includes(dev));
                    return (
                      <div key={dev}>
                        {renderStats(dev, devInitiatives, 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50')}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
