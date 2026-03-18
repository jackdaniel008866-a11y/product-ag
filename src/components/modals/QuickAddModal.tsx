import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Initiative, Product, InitiativeType, Priority, Stage } from '../../types';
import { useUsers } from '../../contexts/UserContext';
import { STAGES } from '../../data/mockData';
import { X } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (initiative: Omit<Initiative, 'id' | 'createdAt' | 'updatedAt' | 'stageUpdatedAt'>) => void;
}

export default function QuickAddModal({ isOpen, onClose, onSave }: QuickAddModalProps) {
  const { users } = useUsers();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [product, setProduct] = useState<Product>('Surbo');
  const [type, setType] = useState<InitiativeType>('Feature');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [ownerId, setOwnerId] = useState('u1'); // Default to Nitin
  const [stage, setStage] = useState<Stage>('Planning');
  const [targetDate, setTargetDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      product,
      type,
      priority,
      ownerId,
      stage,
      status: 'Active',
      targetDate: targetDate ? targetDate : undefined,
      tags: [],
    });

    // Reset form
    setTitle('');
    setDescription('');
    setProduct('Surbo');
    setType('Feature');
    setPriority('Medium');
    setOwnerId('u1');
    setStage('Planning');
    setTargetDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-2xl shadow-xl flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-8 duration-300 overflow-hidden relative">
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Quick Add Initiative</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 relative">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title *</label>
                <input 
                  type="text" 
                  required
                  autoFocus
                  placeholder="What do we need to build?"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-slate-700 bg-slate-50 focus:bg-white transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea 
                  rows={2}
                  placeholder="Add more details about the initiative..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-slate-700 bg-slate-50 focus:bg-white transition-all resize-none"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Product</label>
                  <select 
                    value={product} 
                    onChange={e => setProduct(e.target.value as Product)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-700 bg-slate-50 focus:bg-white"
                  >
                    <option value="Surbo">Surbo</option>
                    <option value="Surbo Chat">Surbo Chat</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value as InitiativeType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-700 bg-slate-50 focus:bg-white"
                  >
                    <option value="Feature">Feature</option>
                    <option value="Enhancement">Enhancement</option>
                    <option value="Client Ask">Client Ask</option>
                    <option value="Bug Theme">Bug Theme</option>
                    <option value="Experiment">Experiment</option>
                    <option value="Internal Improvement">Internal Improvement</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Owner</label>
                  <select 
                    value={ownerId} 
                    onChange={e => setOwnerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-700 bg-slate-50 focus:bg-white"
                  >
                    {Object.values(users).map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Priority</label>
                  <select 
                    value={priority} 
                    onChange={e => setPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-slate-700 bg-slate-50 focus:bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="col-span-1 sm:col-span-1">
                  <label className="block text-sm font-semibold text-teal-700 mb-1">Phase</label>
                  <select 
                    value={stage} 
                    onChange={e => setStage(e.target.value as Stage)}
                    className="w-full px-3 py-2 border-2 border-teal-200 rounded-lg focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/50 text-teal-800 bg-teal-50 font-medium"
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                
                <div className="col-span-1 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Target Date</label>
                  <input 
                    type="date"
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 md:p-6 border-t border-slate-100 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 active:scale-95"
            >
              Add Initiative
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
