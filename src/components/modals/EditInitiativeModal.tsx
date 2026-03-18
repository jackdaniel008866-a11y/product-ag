/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, type FormEvent } from 'react';
import type { Initiative, Product, InitiativeType, Priority, Stage, Status } from '../../types';
import { useUsers } from '../../contexts/UserContext';
import { STAGES } from '../../data/mockData';
import { X, Save, MessageSquare } from 'lucide-react';

interface EditInitiativeModalProps {
  initiative: Initiative | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Initiative>) => void;
  onDelete: (id: string) => void;
}

export default function EditInitiativeModal({ initiative, onClose, onUpdate, onDelete }: EditInitiativeModalProps) {
  const { users } = useUsers();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [product, setProduct] = useState<Product>('Surbo');
  const [type, setType] = useState<InitiativeType>('Feature');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [ownerId, setOwnerId] = useState('u1');
  const [stage, setStage] = useState<Stage>('Discussion');
  const [status, setStatus] = useState<Status>('Active');
  const [notes, setNotes] = useState('');
  const [teamMembers, setTeamMembers] = useState<string[]>([]);

  // Sync state when initiative changes
  useEffect(() => {
    if (initiative) {
      setTitle(initiative.title);
      setDescription(initiative.description || '');
      setProduct(initiative.product);
      setType(initiative.type);
      setPriority(initiative.priority);
      setOwnerId(initiative.ownerId);
      setStage(initiative.stage);
      setStatus(initiative.status);
      setNotes(initiative.notes || '');
      setTeamMembers(initiative.teamMembers || []);
    }
  }, [initiative]);

  if (!initiative) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Check if stage changed to update the timer
    const updates: Partial<Initiative> = {
      title: title.trim(),
      description: description.trim(),
      product,
      type,
      priority,
      ownerId,
      stage,
      status,
      notes: notes.trim(),
      teamMembers,
      updatedAt: new Date().toISOString(),
    };

    if (stage !== initiative.stage) {
      updates.stageUpdatedAt = new Date().toISOString();
    }

    onUpdate(initiative.id, updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded truncate max-w-[120px]">
              {initiative.id}
            </span>
            <h2 className="text-lg font-bold text-slate-800">Edit Initiative</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-6">
            
            {/* Title & Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title *</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 font-medium text-lg border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-800 bg-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea 
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Task specifications, context, or criteria..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-700 bg-white resize-y min-h-[80px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t border-slate-100">
              {/* Product */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Product</label>
                <select 
                  value={product} onChange={e => setProduct(e.target.value as Product)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-700 bg-slate-50"
                >
                  <option value="Surbo">Surbo</option>
                  <option value="Surbo Chat">Surbo Chat</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 animate-pulse">Status</label>
                <select 
                  value={status} onChange={e => setStatus(e.target.value as Status)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 font-medium ${
                    status === 'Blocked' ? 'border-red-300 bg-red-50 text-red-700' : 
                    status === 'Done' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' :
                    'border-slate-300 bg-slate-50 text-slate-700'
                  }`}
                >
                  <option value="Active">🟢 Active</option>
                  <option value="Blocked">🔴 Blocked</option>
                  <option value="Parked">⚪ Parked</option>
                  <option value="Done">✅ Done</option>
                </select>
              </div>

              {/* Phase / Stage */}
              <div>
                <label className="block text-sm font-semibold text-teal-700 mb-1">Phase / Bucket</label>
                <select 
                  value={stage} onChange={e => setStage(e.target.value as Stage)}
                  className="w-full px-3 py-2 border-2 border-teal-200 rounded-lg focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/50 text-teal-800 bg-teal-50 font-medium"
                >
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
                <select 
                  value={type} onChange={e => setType(e.target.value as InitiativeType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-700 bg-slate-50"
                >
                  <option value="Feature">Feature</option>
                  <option value="Enhancement">Enhancement</option>
                  <option value="Client Ask">Client Ask</option>
                  <option value="Bug Theme">Bug Theme</option>
                  <option value="Experiment">Experiment</option>
                  <option value="Internal Improvement">Internal Improvement</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Priority</label>
                <select 
                  value={priority} onChange={e => setPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-700 bg-slate-50"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Owner */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Owner</label>
                <select 
                  value={ownerId} onChange={e => setOwnerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-700 bg-slate-50"
                >
                  {Object.values(users).map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              {/* Team Members */}
              <div className="col-span-2 mt-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Team Members</label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(users).map(user => {
                    const isSelected = teamMembers.includes(user.id);
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setTeamMembers(prev => prev.filter(id => id !== user.id));
                          } else {
                            setTeamMembers(prev => [...prev, user.id]);
                          }
                        }}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                          isSelected 
                            ? 'bg-teal-50 border-teal-200 text-teal-700' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                          {user.initials}
                        </div>
                        <span>{user.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
            
            {/* Updates / Comments */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mt-4">
              <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                <MessageSquare size={16} className="mr-2 text-teal-600" />
                Latest Update / Comments
              </label>
              <textarea 
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="What is the latest status here? Provide an update..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-700 bg-white resize-y"
              />
            </div>
            
          </div>
          
          <div className="p-5 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
            <button 
              type="button" 
              onClick={() => {
                if(confirm('Are you sure you want to delete this initiative?')) {
                  onDelete(initiative.id);
                  onClose();
                }
              }}
              className="px-4 py-2 font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Delete Initiative
            </button>
            <div className="flex space-x-3">
              <button 
                type="button" onClick={onClose}
                className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 active:scale-95 flex items-center"
              >
                <Save size={16} className="mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
