import { useState, useEffect, useRef, type FormEvent } from 'react';
import type { Initiative, Product, InitiativeType, Priority, Stage, Status, Comment } from '../../types';
import { useUsers } from '../../contexts/UserContext';
import { STAGES, DEVELOPER_TEAMS } from '../../data/mockData';
import { X, Save, MessageSquare, Send, Calendar, AtSign, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface EditInitiativeModalProps {
  initiative: Initiative | null;
  currentUserId: string;
  currentUserMetadata: Record<string, any>;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Initiative>) => void;
  onDelete: (id: string) => void;
  onAddComment: (initiativeId: string, comment: Comment) => void;
}

export default function EditInitiativeModal({ initiative, currentUserId, currentUserMetadata, onClose, onUpdate, onDelete, onAddComment }: EditInitiativeModalProps) {
  const { users, usersList } = useUsers();
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState(false);
  const [description, setDescription] = useState('');
  const [product, setProduct] = useState<Product>('Surbo');
  const [type, setType] = useState<InitiativeType>('Feature');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [ownerId, setOwnerId] = useState('u1');
  const [stage, setStage] = useState<Stage>('Planning');
  const [status, setStatus] = useState<Status>('Active');
  const [targetDate, setTargetDate] = useState('');
  const [developers, setDevelopers] = useState<string[]>([]);
  
  // Comment Thread State
  const [newCommentText, setNewCommentText] = useState('');
  // Tagging State
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [tagSearchText, setTagSearchText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state when initiative changes
  useEffect(() => {
    if (initiative) {
      const legacyMap: Record<string, string> = {
        'u1': '12255c92-85a1-46ee-a61b-96041c82424a', 
        'u2': '15f68938-b608-4214-95fe-5c5ec6fbe498',
        'u3': '867782c6-edfd-472a-b1fe-ec3aed9443d4',
        'u4': '4d76bd35-724b-4347-b4a2-ad29171b8069',
        '63942d58-cf33-4f93-8fe7-56bc52831557': '12255c92-85a1-46ee-a61b-96041c82424a'
      };
      
      setTitle(initiative.title);
      setDescription(initiative.description || '');
      setProduct(initiative.product);
      setType(initiative.type);
      setPriority(initiative.priority);
      setOwnerId(legacyMap[initiative.ownerId] || initiative.ownerId);
      setStage(initiative.stage);
      setStatus(initiative.status);
      setTargetDate(initiative.targetDate || '');
      setDevelopers(initiative.developers || []);
      setNewCommentText(''); // Clear draft on open
    }
  }, [initiative]);

  if (!initiative) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    setTitleError(false);

    const finalTargetDate = targetDate ? targetDate : null;
    const existingDate = initiative.targetDate || undefined;
    
    let updatedComments = initiative.comments || [];
    
    if (finalTargetDate !== existingDate) {
      let sysMsg = '';
      if (!existingDate && finalTargetDate) {
        sysMsg = `🎯 Target date was set to ${format(new Date(finalTargetDate), 'MMM d, yyyy')}`;
      } else if (existingDate && !finalTargetDate) {
        sysMsg = `🎯 Target date was removed (previously ${format(new Date(existingDate), 'MMM d, yyyy')})`;
      } else if (existingDate && finalTargetDate) {
        sysMsg = `🎯 Target date changed from ${format(new Date(existingDate), 'MMM d, yyyy')} to ${format(new Date(finalTargetDate), 'MMM d, yyyy')}`;
      }
      
      const sysComment: Comment = {
        id: `sys-${Math.random().toString(36).substring(2, 9)}`,
        authorId: 'system',
        text: sysMsg,
        createdAt: new Date().toISOString(),
        isSystem: true
      };
      
      updatedComments = [...updatedComments, sysComment];
    }

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
      targetDate: finalTargetDate,
      developers,
      updatedAt: new Date().toISOString(),
    };

    if (updatedComments !== initiative.comments) {
      updates.comments = updatedComments;
    }

    if (stage !== initiative.stage) {
      updates.stageUpdatedAt = new Date().toISOString();
    }

    onUpdate(initiative.id, updates);
    onClose();
  };

  const handlePostComment = async () => {
    if (!newCommentText.trim() || !initiative) return;
    
    const comment: Comment = {
      id: `comment-${Math.random().toString(36).substring(2, 9)}`,
      authorId: currentUserId,
      text: newCommentText.trim(),
      createdAt: new Date().toISOString()
    };
    
    onAddComment(initiative.id, comment);
    
    // Process tags
    const taggedUsers = usersList.filter(u => new RegExp(`@${u.name}(\\b|\\s|$)`, 'i').test(newCommentText));
    if (taggedUsers.length > 0) {
      const payloads = taggedUsers.map(u => ({
        user_id: u.id,
        initiative_id: initiative.id,
        message: `${currentUserMetadata.full_name || users[currentUserId]?.name || 'Someone'} tagged you in a comment on "${initiative.title}"`
      }));
      
      const { error } = await supabase.from('notifications').insert(payloads);
      if (error) console.error('Error dispatching notifications:', error);
    } else {

    }

    setNewCommentText('');
    setShowTagMenu(false);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewCommentText(text);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursorPosition);
    // Match @ followed by letters, up to the cursor (Must be empty space before it)
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z\s]*)$/);
    
    if (match && !match[1].includes('  ')) {
      setShowTagMenu(true);
      setTagSearchText(match[1].toLowerCase());
    } else {
      setShowTagMenu(false);
    }
  };

  const insertTag = (userName: string) => {
    if (!textareaRef.current) return;
    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = newCommentText.slice(0, cursorPosition);
    const textAfterCursor = newCommentText.slice(cursorPosition);
    
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z\s]*)$/);
    if (match) {
      const replaceStart = cursorPosition - match[1].length - 1; // -1 for the @ symbol
      const mappedText = newCommentText.slice(0, replaceStart) + `@${userName} ` + textAfterCursor;
      setNewCommentText(mappedText);
    }
    setShowTagMenu(false);
    textareaRef.current.focus();
  };

  const filteredUsers = usersList.filter(u => u.name.toLowerCase().includes(tagSearchText));

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] sm:rounded-2xl shadow-xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden relative border border-transparent dark:border-slate-800 transition-colors">
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 shrink-0 transition-colors">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded truncate max-w-[120px]">
              {initiative.id}
            </span>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Initiative</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 relative">
            
            {/* Title & Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value);
                    if (e.target.value.trim()) setTitleError(false);
                  }}
                  placeholder="Provide a clear, descriptive title"
                  className={`w-full px-3 py-2 font-medium text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-colors ${titleError ? 'border-red-500 text-red-900 bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' : 'border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500'}`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea 
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Task specifications, context, or criteria..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 resize-y min-h-[80px] placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
              {/* Product */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Product</label>
                <select 
                  value={product} onChange={e => setProduct(e.target.value as Product)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="Surbo">Surbo</option>
                  <option value="Surbo Chat">Surbo Chat</option>
                  <option value="Surbo Ace">Surbo Ace</option>
                  <option value="AI Voicebot">AI Voicebot</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 animate-pulse">Status</label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value as Status)}
                  className={`w-full px-3 py-2 border-2 rounded-lg font-bold focus:outline-none transition-colors appearance-none cursor-pointer ${
                    status === 'Active' ? 'border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' :
                    status === 'Blocked' ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                    status === 'Deployed' ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
                    'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <option value="Active">🟢 Active</option>
                  <option value="Blocked">🔴 Blocked</option>
                  <option value="Deployed">✅ Deployed</option>
                  <option value="Parked">⏸️ Parked</option>
                </select>
              </div>

              {/* Phase / Stage */}
              <div>
                <label className="block text-sm font-semibold text-teal-700 dark:text-teal-400 mb-1">Phase / Bucket</label>
                <select 
                  value={stage} onChange={e => setStage(e.target.value as Stage)}
                  className="w-full px-3 py-2 border-2 border-teal-200 dark:border-teal-800 rounded-lg focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/50 text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/10 font-medium"
                >
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Target Date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Date</label>
                <input 
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Type</label>
                <select 
                  value={type} onChange={e => setType(e.target.value as InitiativeType)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800"
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
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                <select 
                  value={priority} onChange={e => setPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Owner */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Owner</label>
                <select 
                  value={ownerId} onChange={e => setOwnerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800"
                >
                  {usersList.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              {/* Developers */}
              <div className="col-span-1 md:col-span-2 mt-2">
                <h3 className="flex items-center text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
                  <Users size={16} className="mr-2 text-indigo-500" />
                  Assigned Developers
                </h3>
                <div className="max-h-48 overflow-y-auto w-full border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 custom-scrollbar space-y-4">
                  {Object.entries(DEVELOPER_TEAMS).map(([team, devs]) => (
                    <div key={team}>
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">{team}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {devs.map(dev => (
                          <label key={dev} className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 p-2 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm">
                            <input 
                              type="checkbox" 
                              checked={developers.includes(dev)}
                              onChange={(e) => {
                                if (e.target.checked) setDevelopers([...developers, dev]);
                                else setDevelopers(developers.filter(d => d !== dev));
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 bg-white w-4 h-4" 
                            />
                            <span className="font-medium select-none">{dev}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            
            {/* Activity Log & Comments */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="flex items-center text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">
                <MessageSquare size={16} className="mr-2 text-teal-600 dark:text-teal-400" />
                Activity Log
              </h3>
              
              {/* Historical Comments */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {(!initiative.comments || initiative.comments.length === 0) ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 border-dashed">No comments yet. Start the conversation!</p>
                ) : (
                  [...initiative.comments].reverse().map(comment => {
                    if (comment.isSystem) {
                      return (
                        <div key={comment.id} className="flex space-x-3 bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-900/40">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0 border border-white dark:border-indigo-800 shadow-sm">
                            <Calendar size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between mb-1">
                              <span className="font-semibold text-sm text-indigo-900 dark:text-indigo-300">System Activity</span>
                              <span className="text-[10px] text-indigo-400 dark:text-indigo-500 font-medium">{format(new Date(comment.createdAt), 'MMM d, h:mm a')}</span>
                            </div>
                            <p className="text-sm text-indigo-700 dark:text-indigo-400 whitespace-pre-wrap leading-relaxed font-medium">{comment.text}</p>
                          </div>
                        </div>
                      );
                    }

                    const author = Object.values(users).find(u => u.id === comment.authorId);
                    
                    // Fallback to active session metadata if they are the author but aren't cached locally yet
                    const isMe = comment.authorId === currentUserId;
                    const displayName = author?.name || (isMe ? currentUserMetadata.full_name : 'Unknown');
                    const displayInitials = author?.initials || (isMe ? `${currentUserMetadata.first_name?.[0] || ''}${currentUserMetadata.last_name?.[0] || ''}`.toUpperCase() || '?' : '??');

                    return (
                      <div key={comment.id} className="flex space-x-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0 border border-white dark:border-slate-800 shadow-sm">
                          {displayInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{displayName}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{format(new Date(comment.createdAt), 'MMM d, h:mm a')}</span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add New Comment Form */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:border-teal-400 dark:focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-400 dark:focus-within:ring-teal-500 transition-all shadow-sm">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Posting as:</span>
                    <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded shadow-sm">
                      <div className="w-4 h-4 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-[8px] font-bold text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                        {users[currentUserId]?.initials || `${currentUserMetadata.first_name?.[0] || ''}${currentUserMetadata.last_name?.[0] || ''}`.toUpperCase() || '?'}
                      </div>
                      <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                        {users[currentUserId]?.name || currentUserMetadata.full_name || 'You'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  {/* Tagging Dropdown */}
                  {showTagMenu && filteredUsers.length > 0 && (
                    <div className="absolute bottom-full mb-1 left-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg overflow-hidden z-20 animate-in slide-in-from-bottom-2 duration-150">
                      <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 flex items-center space-x-1.5 break-words">
                        <AtSign size={12} className="text-teal-600 dark:text-teal-400 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tag Team Member</span>
                      </div>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar">
                        {filteredUsers.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => insertTag(u.name)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center space-x-2 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                          >
                            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                              {u.initials}
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{u.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <textarea 
                    ref={textareaRef}
                    rows={2}
                    value={newCommentText}
                    onChange={handleCommentChange}
                    placeholder="Add a comment... Type @ to tag someone"
                    className="w-full px-3 py-3 border-none focus:outline-none focus:ring-0 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 resize-y placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button 
                    type="button" 
                    onClick={handlePostComment}
                    disabled={!newCommentText.trim()}
                    className="flex items-center px-4 py-1.5 bg-slate-900 dark:bg-black hover:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={12} className="mr-1.5" />
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20 shrink-0 transition-colors">
            <button 
              type="button" 
              onClick={() => {
                if(confirm('Are you sure you want to delete this initiative?')) {
                  onDelete(initiative.id);
                  onClose();
                }
              }}
              className="px-4 py-2 font-medium text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              Delete Initiative
            </button>
            <div className="flex space-x-3">
              <button 
                type="button" onClick={onClose}
                className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-medium rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 active:scale-95 flex items-center"
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
