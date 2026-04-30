import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Search, StickyNote, Check, Calendar, X, MessageSquare, Clock } from 'lucide-react';
import { differenceInDays, parseISO, isAfter, isBefore, startOfDay, endOfDay, format, isSameDay } from 'date-fns';
import { supabase } from '../../lib/supabase';
import type { PersonalTask, PersonalNote, PersonalTaskTag, PersonalUpdate } from '../../types';

const TAGS: PersonalTaskTag[] = ['Surbo', 'Surbo Chat', 'AI Voicebot', 'Meeting', 'Demo', 'Deep Work', 'Client Call', 'Admin', 'Follow Up', 'Review', 'Strategy', 'General'];

type SlideOverState = {
  isOpen: boolean;
  type: 'task' | 'note' | null;
  item: PersonalTask | PersonalNote | null;
};

export default function MySpaceView() {
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Task Input State
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskTags, setNewTaskTags] = useState<PersonalTaskTag[]>([]);

  // Note Input State
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Completed'>('Pending');
  const [startDate, setStartDate] = useState<string>(''); // YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>(''); // YYYY-MM-DD

  // Slide-over state
  const [slideOver, setSlideOver] = useState<SlideOverState>({ isOpen: false, type: null, item: null });
  const [newUpdateText, setNewUpdateText] = useState('');

  useEffect(() => {
    async function loadPersonalData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const [tasksRes, notesRes] = await Promise.all([
        supabase.from('personal_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('personal_notes').select('*').order('created_at', { ascending: false })
      ]);

      const normalizedTasks = (tasksRes.data || []).map(t => ({
        ...t,
        tags: Array.isArray(t.tags) ? t.tags : (t.tags ? [t.tags] : []),
        updates: Array.isArray(t.updates) ? t.updates : []
      }));
      
      const normalizedNotes = (notesRes.data || []).map(n => ({
        ...n,
        updates: Array.isArray(n.updates) ? n.updates : []
      }));

      setTasks(normalizedTasks);
      setNotes(normalizedNotes);
      setIsLoading(false);
    }
    loadPersonalData();
  }, []);

  const handleToggleTag = (tag: PersonalTaskTag) => {
    if (newTaskTags.includes(tag)) {
      setNewTaskTags(prev => prev.filter(t => t !== tag));
    } else {
      setNewTaskTags(prev => [...prev, tag]);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim() || !userId) return;

    const newTask = {
      user_id: userId,
      content: newTaskContent.trim(),
      tags: newTaskTags.length > 0 ? newTaskTags : ['General'],
      is_completed: false,
      updates: []
    };

    const tempId = `temp-${Date.now()}`;
    const optimisticTask: PersonalTask = { ...newTask, id: tempId, created_at: new Date().toISOString(), tags: newTask.tags as PersonalTaskTag[], updates: [] };
    setTasks(prev => [optimisticTask, ...prev]);
    setNewTaskContent('');
    setNewTaskTags([]);

    const { data, error } = await supabase.from('personal_tasks').insert([newTask]).select().single();
    if (!error && data) {
      setTasks(prev => prev.map(t => t.id === tempId ? data : t));
    }
  };

  const toggleTaskCompletion = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.stopPropagation();
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));
    await supabase.from('personal_tasks').update({ is_completed: !currentStatus }).eq('id', id);
  };

  const deleteTask = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('personal_tasks').delete().eq('id', id);
    if (slideOver.item?.id === id) closeSlideOver();
  };

  const handleAddNote = async () => {
    if ((!newNoteTitle.trim() && !newNoteContent.trim()) || !userId) {
      setIsAddingNote(false);
      return;
    }

    const newNote = {
      user_id: userId,
      title: newNoteTitle.trim() || 'Untitled Note',
      content: newNoteContent.trim(),
      updates: []
    };

    const tempId = `temp-note-${Date.now()}`;
    const optimisticNote: PersonalNote = { ...newNote, id: tempId, created_at: new Date().toISOString(), updates: [] };
    setNotes(prev => [optimisticNote, ...prev]);
    
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsAddingNote(false);

    const { data, error } = await supabase.from('personal_notes').insert([newNote]).select().single();
    if (!error && data) {
      setNotes(prev => prev.map(n => n.id === tempId ? data : n));
    }
  };

  const deleteNote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotes(prev => prev.filter(n => n.id !== id));
    await supabase.from('personal_notes').delete().eq('id', id);
    if (slideOver.item?.id === id) closeSlideOver();
  };

  // --- Slide Over & Updates Logic ---
  const openSlideOver = (type: 'task' | 'note', item: PersonalTask | PersonalNote) => {
    setSlideOver({ isOpen: true, type, item });
    setNewUpdateText('');
  };

  const closeSlideOver = () => {
    setSlideOver({ isOpen: false, type: null, item: null });
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdateText.trim() || !slideOver.item || !slideOver.type) return;

    const newUpdate: PersonalUpdate = {
      date: new Date().toISOString(),
      text: newUpdateText.trim()
    };

    const table = slideOver.type === 'task' ? 'personal_tasks' : 'personal_notes';
    const currentUpdates = slideOver.item.updates || [];
    const newUpdatesList = [...currentUpdates, newUpdate];

    // Optimistic Update
    if (slideOver.type === 'task') {
      setTasks(prev => prev.map(t => t.id === slideOver.item!.id ? { ...t, updates: newUpdatesList } : t));
    } else {
      setNotes(prev => prev.map(n => n.id === slideOver.item!.id ? { ...n, updates: newUpdatesList } : n));
    }
    
    setSlideOver(prev => ({ ...prev, item: { ...prev.item!, updates: newUpdatesList } }));
    setNewUpdateText('');

    await supabase.from(table).update({ updates: newUpdatesList }).eq('id', slideOver.item.id);
  };

  // --- Filtering ---
  const isWithinDateRange = (dateStr: string) => {
    if (!startDate && !endDate) return true;
    const date = parseISO(dateStr);
    let isAfterStart = true;
    let isBeforeEnd = true;

    if (startDate) {
      isAfterStart = isAfter(date, startOfDay(parseISO(startDate))) || isSameDay(date, parseISO(startDate));
    }
    if (endDate) {
      isBeforeEnd = isBefore(date, endOfDay(parseISO(endDate))) || isSameDay(date, parseISO(endDate));
    }
    return isAfterStart && isBeforeEnd;
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    if (!matchesSearch) return false;
    if (statusFilter === 'Pending' && t.is_completed) return false;
    if (statusFilter === 'Completed' && !t.is_completed) return false;
    if (!isWithinDateRange(t.created_at)) return false;
    return true;
  });

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (!isWithinDateRange(n.created_at)) return false;
    return true;
  });

  const now = new Date();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col lg:flex-row h-full gap-6 overflow-hidden">
      
      {/* LEFT PANEL: Daily Actions (Tasks) */}
      <div className={`w-full lg:w-5/12 xl:w-1/3 flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all ${slideOver.isOpen ? 'hidden md:flex opacity-30 pointer-events-none' : ''}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-teal-500" />
              Daily Actions
            </h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-1">
              {['All', 'Pending', 'Completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                    statusFilter === status
                      ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            
            {/* Date Range Filter */}
            <div className="flex items-center gap-1">
              <Calendar size={14} className="text-slate-400 ml-1" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="From Date"
                className="w-28 pl-2 pr-1 py-1 text-xs bg-slate-100 dark:bg-slate-800 border-transparent rounded-md text-slate-600 dark:text-slate-300 focus:border-teal-500 focus:ring-teal-500"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="To Date"
                className="w-28 pl-2 pr-1 py-1 text-xs bg-slate-100 dark:bg-slate-800 border-transparent rounded-md text-slate-600 dark:text-slate-300 focus:border-teal-500 focus:ring-teal-500"
              />
              {(startDate || endDate) && (
                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-slate-400 hover:text-red-500 text-xs px-1">Clear</button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <form onSubmit={handleAddTask} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="What needs to be done?"
                value={newTaskContent}
                onChange={(e) => setNewTaskContent(e.target.value)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg px-3 py-2 text-sm focus:border-teal-500 focus:ring-teal-500 dark:text-slate-200"
              />
              <button 
                type="submit" 
                disabled={!newTaskContent.trim()}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors flex items-center justify-center shrink-0"
              >
                <Plus size={18} />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map(tag => {
                const isSelected = newTaskTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2 py-1 text-[10px] font-medium rounded-full transition-colors border ${
                      isSelected 
                        ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/50' 
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {filteredTasks.length === 0 && (
            <div className="text-center text-slate-400 text-sm mt-8">No actions found.</div>
          )}
          
          <div className="space-y-2">
            {filteredTasks.map(task => {
              const isOverdue = !task.is_completed && differenceInDays(now, parseISO(task.created_at)) >= 2;
              const hasUpdates = task.updates && task.updates.length > 0;
              
              return (
                <div 
                  key={task.id} 
                  onClick={() => openSlideOver('task', task)}
                  className={`group flex items-start gap-3 p-3 rounded-lg transition-colors border cursor-pointer ${
                    task.is_completed 
                      ? 'bg-slate-50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/50 opacity-70 hover:opacity-100 hover:border-teal-200 dark:hover:border-teal-800/50' 
                      : isOverdue
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/20'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-teal-200 dark:hover:border-teal-800/50'
                  }`}
                >
                  <button 
                    onClick={(e) => toggleTaskCompletion(e, task.id, task.is_completed)} 
                    className={`mt-0.5 flex-shrink-0 transition-colors ${
                      task.is_completed 
                        ? 'text-teal-500' 
                        : isOverdue
                          ? 'text-red-400 hover:text-red-600'
                          : 'text-slate-300 hover:text-teal-500'
                    }`}
                  >
                    {task.is_completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${
                      task.is_completed 
                        ? 'line-through text-slate-500 dark:text-slate-400' 
                        : isOverdue 
                          ? 'text-red-700 dark:text-red-400 font-medium'
                          : 'text-slate-800 dark:text-slate-200 font-medium'
                    }`}>
                      {task.content}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {(task.tags || []).map(tag => (
                        <span key={tag} className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                          isOverdue && !task.is_completed
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                        }`}>
                          {tag}
                        </span>
                      ))}
                      {isOverdue && !task.is_completed && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 rounded flex items-center gap-1">
                          OVERDUE
                        </span>
                      )}
                      {/* Creation Date Badge on Task */}
                      <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-slate-400">
                        <Clock size={10} /> {format(parseISO(task.created_at), 'MMM d')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button onClick={(e) => deleteTask(e, task.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1">
                      <Trash2 size={14} />
                    </button>
                    {hasUpdates && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-1.5 py-0.5 rounded">
                        <MessageSquare size={10} /> {task.updates!.length}
                      </div>
                    )}
                    {task.is_completed && !hasUpdates && (
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Brain Dump (Notes) */}
      <div className={`w-full lg:w-7/12 xl:w-2/3 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all ${slideOver.isOpen ? 'hidden md:flex opacity-30 pointer-events-none' : ''}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <StickyNote size={20} className="text-amber-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Brain Dump</h2>
          </div>
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes & tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 bg-slate-100 dark:bg-slate-800 border-transparent rounded-full py-2 text-sm focus:border-amber-500 focus:ring-amber-500 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="mb-8">
            {!isAddingNote ? (
              <button 
                onClick={() => setIsAddingNote(true)}
                className="w-full max-w-xl mx-auto block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-4 text-left text-slate-500 dark:text-slate-400 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800/50 transition-all cursor-text"
              >
                Take a note...
              </button>
            ) : (
              <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 rounded-lg shadow-md overflow-hidden">
                <input
                  type="text"
                  placeholder="Title"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full font-bold text-slate-800 dark:text-slate-100 bg-transparent border-none px-4 pt-4 pb-2 focus:ring-0"
                />
                <textarea
                  placeholder="Take a note..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent border-none px-4 pb-4 pt-0 min-h-[100px] text-sm text-slate-700 dark:text-slate-300 focus:ring-0 resize-y"
                />
                <div className="flex justify-end p-2 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700">
                  <button 
                    onClick={handleAddNote}
                    className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                  >
                    <Check size={16} /> Done
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
            {filteredNotes.map(note => (
              <div 
                key={note.id} 
                onClick={() => openSlideOver('note', note)}
                className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800/50 transition-all flex flex-col cursor-pointer"
              >
                <button 
                  onClick={(e) => deleteNote(e, note.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-red-500 p-1.5 rounded-full transition-all"
                >
                  <Trash2 size={14} />
                </button>
                {note.title && (
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 pr-6">{note.title}</h3>
                )}
                <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap flex-1">
                  {note.content}
                </div>
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock size={12} />
                    {format(parseISO(note.created_at), 'MMM d, h:mm a')}
                  </div>
                  {note.updates && note.updates.length > 0 && (
                     <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                       <MessageSquare size={10} /> {note.updates.length}
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SLIDE-OVER PANEL: Updates Timeline */}
      {slideOver.isOpen && slideOver.item && (
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-[450px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {slideOver.type === 'task' ? <CheckCircle2 size={18} className="text-teal-500"/> : <StickyNote size={18} className="text-amber-500"/>}
              {slideOver.type === 'task' ? 'Action Timeline' : 'Note Details'}
            </h3>
            <button onClick={closeSlideOver} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 bg-slate-200 dark:bg-slate-700 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Original Content Recap */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            {slideOver.type === 'task' ? (
              <div>
                <p className="text-lg font-medium text-slate-800 dark:text-slate-100">{(slideOver.item as PersonalTask).content}</p>
                <div className="flex gap-2 mt-3">
                  {((slideOver.item as PersonalTask).tags || []).map(t => (
                    <span key={t} className="px-2 py-1 text-xs font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{t}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{(slideOver.item as PersonalNote).title || 'Untitled Note'}</h3>
                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{(slideOver.item as PersonalNote).content}</p>
              </div>
            )}
            <div className="text-xs text-slate-400 mt-4 flex items-center gap-1">
              <Clock size={12}/> Created {format(parseISO(slideOver.item.created_at), 'PPP')}
            </div>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Updates Log</h4>
            
            {!slideOver.item.updates || slideOver.item.updates.length === 0 ? (
              <div className="text-center text-slate-400 italic text-sm mt-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg py-8">
                No updates logged yet.
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                {slideOver.item.updates.map((update, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Timeline Dot */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                      <MessageSquare size={14} />
                    </div>
                    {/* Card */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 mb-1">{format(parseISO(update.date), 'MMM d, h:mm a')}</div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{update.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Update Input Form */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <form onSubmit={handleAddUpdate} className="flex flex-col gap-3">
              <textarea
                placeholder="Log an update..."
                value={newUpdateText}
                onChange={(e) => setNewUpdateText(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg px-3 py-2 text-sm focus:border-teal-500 focus:ring-teal-500 dark:text-slate-200 resize-none min-h-[80px]"
              />
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={!newUpdateText.trim()}
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Save Update
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
