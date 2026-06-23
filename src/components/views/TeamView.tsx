import { useState, useMemo } from 'react';
import type { User, Initiative, Stage } from '../../types';
import { DEVELOPER_TEAMS, STAGES } from '../../data/mockData';
import { differenceInDays, format, parseISO } from 'date-fns';
import { Users, Trash2, AlertTriangle, Clock, Zap, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface TeamViewProps {
  users: User[];
  onRemoveUser: (id: string) => void;
  initiatives: Initiative[];
}

interface DevStats {
  name: string;
  team: string;
  total: number;
  byStage: Record<string, number>;
  highPriority: number;
  overdue: number;
  avgDaysInStage: number;
  initiatives: Initiative[];
}

const STAGE_COLORS: Record<string, string> = {
  'Roadmap': 'bg-purple-500',
  'Planning': 'bg-blue-500',
  'Execution': 'bg-amber-500',
  'Testing': 'bg-orange-500',
  'Deployed': 'bg-emerald-500',
  'Parked': 'bg-slate-400',
};

const STAGE_TEXT_COLORS: Record<string, string> = {
  'Roadmap': 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50',
  'Planning': 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50',
  'Execution': 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50',
  'Testing': 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50',
  'Deployed': 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50',
  'Parked': 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
};

export default function TeamView({ users, onRemoveUser, initiatives }: TeamViewProps) {
  const [expandedDev, setExpandedDev] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserManager, setShowUserManager] = useState(false);

  const devStats: DevStats[] = useMemo(() => {
    const allDevs: { name: string; team: string }[] = [];
    Object.entries(DEVELOPER_TEAMS).forEach(([team, devs]) => {
      devs.forEach(dev => allDevs.push({ name: dev, team }));
    });

    return allDevs.map(({ name, team }) => {
      const devInits = initiatives.filter(i => (i.developers || []).includes(name));
      const activeInits = devInits.filter(i => i.stage !== 'Deployed' && i.stage !== 'Parked');
      
      const byStage: Record<string, number> = {};
      STAGES.forEach(s => { byStage[s] = 0; });
      devInits.forEach(i => { byStage[i.stage] = (byStage[i.stage] || 0) + 1; });

      const highPriority = activeInits.filter(i => i.priority === 'High').length;
      
      const overdue = activeInits.filter(i => {
        if (!i.targetDate) return false;
        return new Date(i.targetDate) < new Date() && i.stage !== 'Deployed';
      }).length;

      const totalDays = activeInits.reduce((sum, i) => sum + differenceInDays(new Date(), parseISO(i.stageUpdatedAt)), 0);
      const avgDaysInStage = activeInits.length > 0 ? Math.round(totalDays / activeInits.length) : 0;

      return {
        name,
        team,
        total: devInits.length,
        byStage,
        highPriority,
        overdue,
        avgDaysInStage,
        initiatives: devInits,
      };
    });
  }, [initiatives]);

  const filteredDevs = devStats.filter(dev => {
    if (teamFilter !== 'All' && dev.team !== teamFilter) return false;
    if (searchQuery && !dev.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const teams = Object.keys(DEVELOPER_TEAMS);

  // Summary stats
  const totalAssignments = devStats.reduce((s, d) => s + d.total, 0);
  const totalOverdue = devStats.reduce((s, d) => s + d.overdue, 0);
  const busiestDev = devStats.reduce((max, d) => (d.total > max.total ? d : max), devStats[0]);
  const idleDev = devStats.filter(d => d.total === 0);

  const getLoadColor = (total: number) => {
    if (total === 0) return 'text-slate-400 dark:text-slate-500';
    if (total <= 2) return 'text-emerald-600 dark:text-emerald-400';
    if (total <= 4) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getLoadBg = (total: number) => {
    if (total === 0) return 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700';
    if (total <= 2) return 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50';
    if (total <= 4) return 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50';
    return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50';
  };

  const getLoadLabel = (total: number) => {
    if (total === 0) return 'Available';
    if (total <= 2) return 'Light';
    if (total <= 4) return 'Moderate';
    return 'Heavy';
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 px-4 md:px-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 transition-colors shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users size={20} className="text-indigo-500" />
            Developer Workload
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time capacity and assignment overview for engineering.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search developers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:text-slate-200 w-40"
            />
          </div>

          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            className="text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="All">All Teams</option>
            {teams.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <button
            onClick={() => setShowUserManager(!showUserManager)}
            className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            {showUserManager ? 'Hide' : 'Manage'} Users
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0B1120] p-4 md:p-6 transition-colors custom-scrollbar">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Total Assignments</div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalAssignments}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Overdue Items</div>
            <div className={`text-2xl font-black ${totalOverdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{totalOverdue}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Busiest</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{busiestDev?.name || '-'}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{busiestDev?.total || 0} tickets</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Available</div>
            <div className={`text-2xl font-black ${idleDev.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{idleDev.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">devs with 0 tickets</div>
          </div>
        </div>

        {/* Developer Cards */}
        <div className="space-y-6">
          {teams.filter(t => teamFilter === 'All' || t === teamFilter).map(team => {
            const teamDevs = filteredDevs.filter(d => d.team === team);
            if (teamDevs.length === 0) return null;

            return (
              <div key={team}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 ml-1 flex items-center gap-2">
                  {team}
                  <span className="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full text-[10px]">
                    {teamDevs.length}
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamDevs.map(dev => {
                    const isExpanded = expandedDev === dev.name;
                    const activeInits = dev.initiatives.filter(i => i.stage !== 'Deployed' && i.stage !== 'Parked');

                    return (
                      <div key={dev.name} className={`bg-white dark:bg-slate-900 rounded-xl border shadow-sm transition-all ${getLoadBg(activeInits.length)}`}>
                        {/* Card Header */}
                        <div 
                          className="p-4 cursor-pointer"
                          onClick={() => setExpandedDev(isExpanded ? null : dev.name)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-sm font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                {dev.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800 dark:text-slate-100">{dev.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-xs font-bold ${getLoadColor(activeInits.length)}`}>
                                    {getLoadLabel(activeInits.length)}
                                  </span>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    {activeInits.length} active / {dev.total} total
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {dev.overdue > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full border border-red-200 dark:border-red-900/50">
                                  <AlertTriangle size={10} />
                                  {dev.overdue}
                                </span>
                              )}
                              {dev.highPriority > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-900/50">
                                  <Zap size={10} />
                                  {dev.highPriority}
                                </span>
                              )}
                              {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                            </div>
                          </div>

                          {/* Stage Bar */}
                          {dev.total > 0 && (
                            <div className="flex rounded-full overflow-hidden h-2.5 bg-slate-100 dark:bg-slate-800">
                              {STAGES.filter(s => dev.byStage[s] > 0).map(stage => (
                                <div
                                  key={stage}
                                  className={`${STAGE_COLORS[stage]} transition-all`}
                                  style={{ width: `${(dev.byStage[stage] / dev.total) * 100}%` }}
                                  title={`${stage}: ${dev.byStage[stage]}`}
                                />
                              ))}
                            </div>
                          )}

                          {/* Stage Legend (compact) */}
                          {dev.total > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {STAGES.filter(s => dev.byStage[s] > 0).map(stage => (
                                <span key={stage} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <span className={`w-2 h-2 rounded-full ${STAGE_COLORS[stage]}`} />
                                  {stage} ({dev.byStage[stage]})
                                </span>
                              ))}
                            </div>
                          )}

                          {dev.avgDaysInStage > 0 && (
                            <div className="flex items-center gap-1 mt-2 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                              <Clock size={10} />
                              Avg {dev.avgDaysInStage}d in current stage
                            </div>
                          )}
                        </div>

                        {/* Expanded: Initiative List */}
                        {isExpanded && dev.initiatives.length > 0 && (
                          <div className="border-t border-slate-100 dark:border-slate-800 p-3 max-h-64 overflow-y-auto custom-scrollbar">
                            <div className="space-y-2">
                              {dev.initiatives.map(init => {
                                const isOverdue = init.targetDate && new Date(init.targetDate) < new Date() && init.stage !== 'Deployed';
                                return (
                                  <div 
                                    key={init.id} 
                                    className={`p-2.5 rounded-lg border text-sm transition-colors ${
                                      isOverdue 
                                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50' 
                                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="font-medium text-slate-800 dark:text-slate-100 line-clamp-1 text-[13px]">{init.title}</p>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${STAGE_TEXT_COLORS[init.stage]}`}>
                                            {init.stage}
                                          </span>
                                          {init.priority === 'High' && (
                                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-600 dark:text-red-400">
                                              <Zap size={9} className="fill-red-500" /> High
                                            </span>
                                          )}
                                          {isOverdue && (
                                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-600 dark:text-red-400">
                                              <AlertTriangle size={9} /> Overdue
                                            </span>
                                          )}
                                          {init.targetDate && (
                                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                                              Due {format(parseISO(init.targetDate), 'MMM d')}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                                        {init.product}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {isExpanded && dev.initiatives.length === 0 && (
                          <div className="border-t border-slate-100 dark:border-slate-800 p-4 text-center text-sm text-slate-400 dark:text-slate-500 italic">
                            No tickets assigned
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Manager (collapsible) */}
        {showUserManager && (
          <div className="mt-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in slide-in-from-bottom-3 duration-300 transition-colors">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Registered Accounts</h2>
              <span className="bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-400 text-xs font-bold px-2 py-1 rounded-full">
                {users.length} Members
              </span>
            </div>
            
            {users.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">No team members yet.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {users.map((user) => (
                  <div key={user.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm border border-slate-300 dark:border-slate-600">
                        {user.initials}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">{user.name}</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate max-w-[180px]">{user.id}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${user.name} from the team?`)) {
                          onRemoveUser(user.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Remove User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
