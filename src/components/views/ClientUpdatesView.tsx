import { useState } from 'react';
import type { SalesRequest } from '../../types';
import { useUsers } from '../../contexts/UserContext';
import { format, isPast, parseISO } from 'date-fns';
import { clsx } from 'clsx';
import { Briefcase, AlertCircle, Search, Edit3 } from 'lucide-react';
import AddSalesRequestModal from '../modals/AddSalesRequestModal';
import EditSalesRequestModal from '../modals/EditSalesRequestModal';

interface ClientUpdatesViewProps {
  salesRequests: SalesRequest[];
  onSave: (req: Omit<SalesRequest, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdate: (id: string, req: Partial<SalesRequest>) => void;
  onDelete: (id: string) => void;
}

export default function ClientUpdatesView({ salesRequests, onSave, onUpdate, onDelete }: ClientUpdatesViewProps) {
  const { users } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<SalesRequest | null>(null);

  const filteredRequests = salesRequests.filter(req => 
    req.client_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.sales_poc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      
      {/* Header Utilities */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 px-4 md:px-6 flex justify-between items-center transition-colors">
        <h2 className="text-xl font-bold flex items-center text-slate-800 dark:text-slate-100">
          <Briefcase className="mr-2 text-indigo-500" size={20} />
          Sales Support Tracker
        </h2>
        
        <div className="flex space-x-3 items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search prospects..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors dark:text-slate-200"
            />
          </div>
          <button 
             onClick={() => setIsAddOpen(true)}
             className="px-4 py-1.5 text-sm font-semibold rounded-lg text-white bg-indigo-500 hover:bg-indigo-600 transition-all flex items-center shadow-sm"
          >
             Add Request
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-[#0B1120] p-4 md:p-6 transition-colors">
         {filteredRequests.length === 0 ? (
           <div className="flex flex-col items-center justify-center p-12 text-slate-500">
             <Briefcase size={40} className="mb-4 opacity-30 dark:opacity-20" />
             <p className="font-semibold text-lg text-slate-700 dark:text-slate-300">No client requests found</p>
             <p className="text-sm">They will appear here once added by your team.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRequests.map(req => {
                const isOverdue = req.follow_up_date && isPast(parseISO(req.follow_up_date)) && !req.status.startsWith('Closed');
                
                return (
                  <div key={req.id} className={clsx(
                    "bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border transition-colors flex flex-col group relative",
                    isOverdue ? "border-amber-300 dark:border-amber-800/60" : "border-slate-200 dark:border-slate-800"
                  )}>
                    {isOverdue && (
                      <div className="absolute -top-2.5 -right-2.5 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center shadow-md">
                        <AlertCircle size={10} className="mr-1" /> Overdue
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-2">
                       <div>
                         <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center">{req.client_name}</h3>
                         <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Sales POC: <span className="text-slate-700 dark:text-slate-300">{req.sales_poc}</span></p>
                       </div>
                       <button 
                          onClick={() => setEditingRequest(req)}
                          className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors p-1"
                       >
                          <Edit3 size={16} />
                       </button>
                    </div>

                    <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg my-2 border border-slate-100 dark:border-slate-800/80 line-clamp-3">
                      {req.description}
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Product Lead:</span>
                         <div className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300">
                            {req.product_owner_id && users[req.product_owner_id] ? (
                              <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-[8px] font-bold mr-1.5 border border-indigo-200 dark:border-indigo-800">
                                   {users[req.product_owner_id].initials}
                                </div>
                                {users[req.product_owner_id].name}
                              </div>
                            ) : 'Unassigned'}
                         </div>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className={clsx(
                           "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border",
                           req.status === 'Assisting' ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50" :
                           req.status === 'Awaiting Sales Update' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50" :
                           req.status === 'Closed - Won' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50" :
                           "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                         )}>
                           {req.status}
                         </span>
                         
                         <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
                           {req.follow_up_date ? `Follow up: ${format(parseISO(req.follow_up_date), 'MMM d, yyyy')}` : 'No date'}
                         </span>
                       </div>
                    </div>
                  </div>
                );
              })}
           </div>
         )}
      </div>

      <AddSalesRequestModal 
         isOpen={isAddOpen} 
         onClose={() => setIsAddOpen(false)} 
         onSave={onSave} 
      />

      <EditSalesRequestModal 
         request={editingRequest}
         onClose={() => setEditingRequest(null)}
         onUpdate={onUpdate}
         onDelete={onDelete}
      />
    </div>
  );
}
