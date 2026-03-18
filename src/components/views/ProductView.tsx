import { useState } from 'react';
import type { Initiative, Stage } from '../../types';
import { differenceInDays, format } from 'date-fns';
import { useUsers } from '../../contexts/UserContext';
import { Calendar } from 'lucide-react';

const STAGES: Stage[] = ['Roadmap', 'Planning', 'Execution', 'Testing', 'Deployed', 'Parked'];

interface ProductViewProps {
  initiatives: Initiative[];
  onInitiativeClick: (id: string) => void;
}

export default function ProductView({ initiatives, onInitiativeClick }: ProductViewProps) {
  const { users } = useUsers();
  const [timeFilterDays, setTimeFilterDays] = useState<number>(30);

  // Filter initiatives by updatedAt being within the selected timeframe (or all if 0)
  const filteredInitiatives = timeFilterDays === 0 
    ? initiatives 
    : initiatives.filter(i => differenceInDays(new Date(), new Date(i.updatedAt)) <= timeFilterDays);

  const surbo = filteredInitiatives.filter(i => i.product === 'Surbo');
  const surboChat = filteredInitiatives.filter(i => i.product === 'Surbo Chat');

  const renderStats = (title: string, data: Initiative[], badgeColor: string) => {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[80vh]">
        <div className={`p-4 border-b border-slate-100 flex items-center justify-between shadow-sm shrink-0 ${badgeColor}`}>
          <h3 className="font-bold text-lg">{title}</h3>
          <span className="font-medium bg-white/40 text-slate-800 px-2.5 py-0.5 rounded-full text-xs shadow-sm border border-white/20">{data.length} Initiatives</span>
        </div>
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
          <div className="space-y-6">
            {STAGES.map(stage => {
              const items = data.filter(i => i.stage === stage);
              if (items.length === 0) return null;

              return (
                <div key={stage} className="animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-1.5">
                    <h4 className="font-bold text-sm text-slate-700 tracking-tight uppercase">{stage}</h4>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 border border-slate-300/50 px-2 py-0.5 rounded-full">
                      {items.length}
                    </span>
                  </div>
                  
                  <div className="space-y-2.5">
                    {items.map(init => (
                      <div 
                        key={init.id} 
                        onClick={() => onInitiativeClick(init.id)}
                        className="bg-white border border-slate-200 shadow-sm p-3 rounded-lg flex flex-col space-y-2 hover:border-teal-300 hover:shadow transition-all cursor-pointer group"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-sm text-slate-800 line-clamp-2 leading-tight group-hover:text-teal-700 transition-colors">{init.title}</span>
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded shrink-0 border ${
                            init.status === 'Blocked' ? 'bg-red-50 text-red-700 border-red-200' :
                            init.status === 'Deployed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            init.status === 'Parked' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                            'bg-teal-50 text-teal-700 border-teal-200'
                          }`}>
                            {init.status}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-1">
                          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                            <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                              {init.ownerId ? users[init.ownerId]?.initials || '??' : '??'}
                            </div>
                            <span>{init.ownerId ? users[init.ownerId]?.name || 'Unassigned' : 'Unassigned'}</span>
                          </div>
                          
                          {init.targetDate && (
                            <div className="flex items-center text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/50">
                              <Calendar size={10} className="mr-1" />
                              <span>{format(new Date(init.targetDate), 'MMM d')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
          <h2 className="text-2xl font-bold text-slate-800">Product Focus Breakdown</h2>
          <p className="text-slate-500 text-sm mt-1">High-level distribution of initiatives actively moved within this timeframe.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto overflow-x-auto hide-scrollbar">
          {[1, 7, 15, 30, 45, 60, 90, 0].map(days => (
            <button
              key={days}
              onClick={() => setTimeFilterDays(days)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                timeFilterDays === days 
                  ? 'bg-white text-teal-700 shadow-sm border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              {days === 0 ? 'All Time' : `${days} Days`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderStats('Surbo', surbo, 'bg-teal-50 text-teal-800 border-teal-100')}
        {renderStats('Surbo Chat', surboChat, 'bg-blue-50 text-blue-800 border-blue-100')}
      </div>
    </div>
  );
}
