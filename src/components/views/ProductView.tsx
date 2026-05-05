import { useState, useMemo } from 'react';
import type { Initiative } from '../../types';
import { differenceInDays, parseISO, isAfter, isBefore, startOfDay, endOfDay, format } from 'date-fns';
import { STAGES, DEVELOPER_TEAMS } from '../../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';

interface ProductViewProps {
  initiatives: Initiative[];
}

export default function ProductView({ initiatives }: ProductViewProps) {
  const [timeFilterDays, setTimeFilterDays] = useState<number>(30);
  const [analyticsStartDate, setAnalyticsStartDate] = useState('');
  const [analyticsEndDate, setAnalyticsEndDate] = useState('');

  // Process data for Recharts Spillover Graph using Ledger Logic
  const spilloverData = useMemo(() => {
    const grouped: Record<string, any> = {};
    const today = new Date();

    initiatives.forEach(init => {
      const history = init.targetDateHistory || [];
      if (history.length === 0) return;

      history.forEach((log, index) => {
        // Skip invalid dates
        if (!log.date) return;
        
        const dateStr = format(parseISO(log.date), 'MMM d, yyyy');
        if (!grouped[dateStr]) {
          grouped[dateStr] = { 
            dateStr, 
            Completed: 0, 
            Deferred: 0, 
            PulledForward: 0,
            SpilledOver: 0, 
            Upcoming: 0, 
            rawDate: parseISO(log.date),
            items: {
              Completed: [] as Initiative[],
              Deferred: [] as any[],
              PulledForward: [] as any[],
              SpilledOver: [] as Initiative[],
              Upcoming: [] as Initiative[]
            }
          };
        }

        const nextLog = history[index + 1];

        if (nextLog && nextLog.date) {
          // Date was changed!
          const isPushedBack = isAfter(startOfDay(parseISO(nextLog.date)), startOfDay(parseISO(log.date)));
          if (isPushedBack) {
            grouped[dateStr].Deferred += 1;
            grouped[dateStr].items.Deferred.push({ ...init, displayNextDate: nextLog.date });
          } else {
            grouped[dateStr].PulledForward += 1;
            grouped[dateStr].items.PulledForward.push({ ...init, displayNextDate: nextLog.date });
          }
        } else {
          // This is the current/final target date.
          // If the actual current targetDate is null, it means it was removed after this log.
          if (!init.targetDate) return; 

          const isCompleted = init.stage === 'Deployed';
          const isPast = isBefore(startOfDay(parseISO(log.date)), startOfDay(today));

          if (isCompleted) {
            grouped[dateStr].Completed += 1;
            grouped[dateStr].items.Completed.push(init);
          } else if (isPast) {
            grouped[dateStr].SpilledOver += 1;
            grouped[dateStr].items.SpilledOver.push(init);
          } else {
            grouped[dateStr].Upcoming += 1;
            grouped[dateStr].items.Upcoming.push(init);
          }
        }
      });
    });

    // Apply Date Filter AFTER grouping so we don't lose hops
    let result = Object.values(grouped);
    if (analyticsStartDate) {
      result = result.filter(g => isAfter(g.rawDate, startOfDay(parseISO(analyticsStartDate))) || format(g.rawDate, 'yyyy-MM-dd') === analyticsStartDate);
    }
    if (analyticsEndDate) {
      result = result.filter(g => isBefore(g.rawDate, endOfDay(parseISO(analyticsEndDate))) || format(g.rawDate, 'yyyy-MM-dd') === analyticsEndDate);
    }

    // Sort chronologically
    return result.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
  }, [initiatives, analyticsStartDate, analyticsEndDate]);

  // Filter initiatives by updatedAt being within the selected timeframe (or all if 0)
  const filteredInitiatives = timeFilterDays === 0 
    ? initiatives 
    : initiatives.filter(i => differenceInDays(new Date(), new Date(i.updatedAt)) <= timeFilterDays);

  const surbo = filteredInitiatives.filter(i => i.product === 'Surbo');
  const surboChat = filteredInitiatives.filter(i => i.product === 'Surbo Chat');
  const surboAce = filteredInitiatives.filter(i => i.product === 'Surbo Ace');
  const aiVoicebot = filteredInitiatives.filter(i => i.product === 'AI Voicebot');
  
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderStats('Surbo', surbo, 'bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-400 border-teal-100 dark:border-teal-900/50')}
        {renderStats('Surbo Chat', surboChat, 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-100 dark:border-blue-900/50')}
        {renderStats('Surbo Ace', surboAce, 'bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border-purple-100 dark:border-purple-900/50')}
        {renderStats('AI Voicebot', aiVoicebot, 'bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 border-rose-100 dark:border-rose-900/50')}
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

      {/* Spillover Analytics Section */}
      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="mb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Sprint Capacity & Spillover</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Analyze planned target dates vs actual completion and deferrals.</p>
          </div>
          
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 shadow-sm">
            <Calendar size={16} className="text-slate-400 ml-1" />
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Target Date Filter:</span>
            <input 
               type="date"
               value={analyticsStartDate}
               onChange={e => setAnalyticsStartDate(e.target.value)}
               className="bg-transparent text-sm py-1 px-1 outline-none text-slate-700 dark:text-slate-200 font-medium w-32 [color-scheme:light] dark:[color-scheme:dark]"
            />
            <span className="text-xs text-slate-400">to</span>
            <input 
               type="date"
               value={analyticsEndDate}
               onChange={e => setAnalyticsEndDate(e.target.value)}
               className="bg-transparent text-sm py-1 px-1 outline-none text-slate-700 dark:text-slate-200 font-medium w-32 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          {spilloverData.length > 0 ? (
            <>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spilloverData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis 
                      dataKey="dateStr" 
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false} 
                      allowDecimals={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#fff' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '14px', fontWeight: 500 }} />
                    <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Upcoming" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="PulledForward" name="Pulled Forward" stackId="a" fill="#c084fc" />
                    <Bar dataKey="SpilledOver" name="Spilled Over" stackId="a" fill="#ef4444" />
                    <Bar dataKey="Deferred" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Ticket Breakdown */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Ticket Breakdown</h3>
                <div className="space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                  {spilloverData.map((data: any) => (
                    <div key={data.dateStr} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-3 text-sm">{data.dateStr}</h4>
                      
                      <div className="space-y-4">
                        {data.items.Completed.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1 block">Completed</span>
                            <div className="space-y-1">
                              {data.items.Completed.map((init: any) => <div key={init.id} className="text-sm text-slate-600 dark:text-slate-300 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>{init.title}</div>)}
                            </div>
                          </div>
                        )}
                        
                        {data.items.Deferred.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1 block">Deferred (Pushed Back)</span>
                            <div className="space-y-1">
                              {data.items.Deferred.map((init: any) => <div key={init.id} className="text-sm text-slate-600 dark:text-slate-300 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2"></span>{init.title} <span className="text-xs text-slate-400 ml-2">→ {format(new Date(init.displayNextDate), 'MMM d')}</span></div>)}
                            </div>
                          </div>
                        )}

                        {data.items.PulledForward?.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1 block">Pulled Forward</span>
                            <div className="space-y-1">
                              {data.items.PulledForward.map((init: any) => <div key={init.id} className="text-sm text-slate-600 dark:text-slate-300 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2"></span>{init.title} <span className="text-xs text-slate-400 ml-2">→ {format(new Date(init.displayNextDate), 'MMM d')}</span></div>)}
                            </div>
                          </div>
                        )}

                        {data.items.SpilledOver.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1 block">Spilled Over (Overdue)</span>
                            <div className="space-y-1">
                              {data.items.SpilledOver.map((init: any) => <div key={init.id} className="text-sm text-slate-600 dark:text-slate-300 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>{init.title}</div>)}
                            </div>
                          </div>
                        )}

                        {data.items.Upcoming.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1 block">Upcoming</span>
                            <div className="space-y-1">
                              {data.items.Upcoming.map((init: any) => <div key={init.id} className="text-sm text-slate-600 dark:text-slate-300 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>{init.title}</div>)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="h-[400px] w-full flex flex-col items-center justify-center text-slate-400">
              <Calendar size={48} className="opacity-20 mb-4" />
              <p className="text-lg font-medium text-slate-500">No Target Dates Set</p>
              <p className="text-sm">Assign target dates to initiatives to see sprint capacity.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
