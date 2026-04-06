import { useState, useEffect } from 'react';
import type { SalesRequest, SalesRequestStatus } from '../../types';
import { useUsers } from '../../contexts/UserContext';
import { X, Trash2 } from 'lucide-react';

interface EditSalesRequestModalProps {
  request: SalesRequest | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<SalesRequest>) => void;
  onDelete: (id: string) => void;
}

export default function EditSalesRequestModal({ request, onClose, onUpdate, onDelete }: EditSalesRequestModalProps) {
  const { usersList } = useUsers();
  
  const [clientName, setClientName] = useState('');
  const [salesPoc, setSalesPoc] = useState('');
  const [description, setDescription] = useState('');
  const [productOwner, setProductOwner] = useState('');
  const [status, setStatus] = useState<SalesRequestStatus>('Assisting');
  const [outcome, setOutcome] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  useEffect(() => {
    if (request) {
      setClientName(request.client_name);
      setSalesPoc(request.sales_poc);
      setDescription(request.description);
      setProductOwner(request.product_owner_id || '');
      setStatus(request.status);
      setOutcome(request.outcome || '');
      setFollowUpDate(request.follow_up_date ? request.follow_up_date.split('T')[0] : '');
    }
  }, [request]);

  if (!request) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !salesPoc.trim()) return;

    onUpdate(request.id, {
      client_name: clientName.trim(),
      sales_poc: salesPoc.trim(),
      description: description.trim(),
      product_owner_id: productOwner || undefined,
      status,
      outcome: outcome.trim() || undefined,
      follow_up_date: followUpDate || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-xl flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Sales Request</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded bg-white dark:bg-slate-800 border shadow-sm">
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Prospect / Client Name *</label>
                <input 
                  required type="text"
                  value={clientName} onChange={e => setClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Sales POC *</label>
                <input 
                  required type="text"
                  value={salesPoc} onChange={e => setSalesPoc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Request Description *</label>
              <textarea 
                required rows={3}
                value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select 
                  value={status} onChange={e => setStatus(e.target.value as SalesRequestStatus)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                >
                  <option value="Assisting">Assisting</option>
                  <option value="Awaiting Sales Update">Awaiting Sales Update</option>
                  <option value="Closed - Won">Closed - Won</option>
                  <option value="Closed - Lost">Closed - Lost</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Follow Up</label>
                <input 
                  type="date"
                  value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Lead</label>
              <select 
                value={productOwner} onChange={e => setProductOwner(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="">Unassigned</option>
                {usersList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            {(status === 'Closed - Won' || status === 'Closed - Lost') && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Outcome / Result Notes</label>
                <textarea 
                  rows={2} placeholder="Summarize the deal conclusion..."
                  value={outcome} onChange={e => setOutcome(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 resize-none"
                />
              </div>
            )}

          </div>
          
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 rounded-b-2xl">
            <button 
              type="button" 
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this sales request?")) {
                  onDelete(request.id);
                  onClose();
                }
              }} 
              className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded flex items-center transition-colors"
            >
              <Trash2 size={16} className="mr-1.5" /> Delete
            </button>
            <div className="space-x-3">
               <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                 Cancel
               </button>
               <button type="submit" className="px-4 py-2 text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-sm">
                 Save Changes
               </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
