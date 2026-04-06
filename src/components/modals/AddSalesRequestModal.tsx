import { useState } from 'react';
import type { SalesRequest } from '../../types';
import { useUsers } from '../../contexts/UserContext';
import { X } from 'lucide-react';

interface AddSalesRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (req: Omit<SalesRequest, 'id' | 'created_at' | 'updated_at'>) => void;
}

export default function AddSalesRequestModal({ isOpen, onClose, onSave }: AddSalesRequestModalProps) {
  const { usersList } = useUsers();
  
  const [clientName, setClientName] = useState('');
  const [salesPoc, setSalesPoc] = useState('');
  const [description, setDescription] = useState('');
  const [productOwner, setProductOwner] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !salesPoc.trim()) return;

    onSave({
      client_name: clientName.trim(),
      sales_poc: salesPoc.trim(),
      description: description.trim(),
      product_owner_id: productOwner || undefined,
      status: 'Assisting',
      follow_up_date: followUpDate || undefined
    });

    setClientName('');
    setSalesPoc('');
    setDescription('');
    setProductOwner('');
    setFollowUpDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-xl flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Log New Client Request</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded bg-white dark:bg-slate-800 border shadow-sm">
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-5 space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Prospect / Client Name *</label>
                <input 
                  required autoFocus type="text"
                  placeholder="e.g. Acme Corp"
                  value={clientName} onChange={e => setClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Sales POC *</label>
                <input 
                  required type="text"
                  placeholder="Who requested help?"
                  value={salesPoc} onChange={e => setSalesPoc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Request Description *</label>
              <textarea 
                required rows={3}
                placeholder="What exactly do they need from Product?"
                value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Lead Assisting</label>
                <select 
                  value={productOwner} onChange={e => setProductOwner(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <option value="">Unassigned</option>
                  {usersList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Follow Up Date</label>
                <input 
                  type="date"
                  value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>

          </div>
          
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-sm">
              Create Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
