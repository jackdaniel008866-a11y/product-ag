import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Search, StickyNote, Check, Calendar } from 'lucide-react';
import { differenceInDays, parseISO, isSameDay } from 'date-fns';
import { supabase } from '../../lib/supabase';
import type { PersonalTask, PersonalNote, PersonalTaskTag } from '../../types';

const TAGS: PersonalTaskTag[] = ['Surbo', 'Surbo Chat', 'AI Voicebot', 'Meeting', 'Demo', 'Deep Work', 'Client Call', 'Admin', 'Follow Up', 'Review', 'Strategy', 'General'];

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
  const [dateFilter, setDateFilter] = useState<string>(''); // YYYY-MM-DD

  useEffect(() => {
    async function loadPersonalData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const [tasksRes, notesRes] = await Promise.all([
        supabase.from('personal_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('personal_notes').select('*').order('created_at', { ascending: false })
      ]);

      // Normalize tags for tasks in case they come back as null or old format
      const normalizedTasks = (tasksRes.data || []).map(t => ({
        ...t,
        tags: Array.isArray(t.tags) ? t.tags : (t.tags ? [t.tags] : []) // fallback
      }));

      setTasks(normalizedTasks);
      if (notesRes.data) setNotes(notesRes.data);
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
      is_completed: false
    };

    const tempId = `temp-${Date.now()}`;
    const optimisticTask: PersonalTask = { ...newTask, id: tempId, created_at: new Date().toISOString(), tags: newTask.tags as PersonalTaskTag[] };
    setTasks(prev => [optimisticTask, ...prev]);
    setNewTaskContent('');
    setNewTaskTags([]);

    const { data, error } = await supabase.from('personal_tasks').insert([newTask]).select().single();
    if (!error && data) {
      setTasks(prev => prev.map(t => t.id === tempId ? data : t));
    }
  };

  const toggleTaskCompletion = async (id: string, currentStatus: boolean) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));
    await supabase.from('personal_tasks').update({ is_completed: !currentStatus }).eq('id', id);
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('personal_tasks').delete().eq('id', id);
  };

  const handleAddNote = async () => {
    if ((!newNoteTitle.trim() && !newNoteContent.trim()) || !userId) {
      setIsAddingNote(false);
      return;
    }

    const newNote = {
      user_id: userId,
      title: newNoteTitle.trim() || 'Untitled Note',
      content: newNoteContent.trim()
    };

    const tempId = `temp-note-${Date.now()}`;
    const optimisticNote: PersonalNote = { ...newNote, id: tempId, created_at: new Date().toISOString() };
    setNotes(prev => [optimisticNote, ...prev]);
    
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsAddingNote(false);

    const { data, error } = await supabase.from('personal_notes').insert([newNote]).select().single();
    if (!error && data) {
      setNotes(prev => prev.map(n => n.id === tempId ? data : n));
    }
  };

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    await supabase.from('personal_notes').delete().eq('id', id);
  };

  const filteredTasks = tasks.filter(t => {
    // 1. Search filter
    const matchesSearch = t.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    if (!matchesSearch) return false;

    // 2. Status filter
    if (statusFilter === 'Pending' && t.is_completed) return false;
    if (statusFilter === 'Completed' && !t.is_completed) return false;

    // 3. Date filter
    if (dateFilter) {
      if (!isSameDay(parseISO(t.created_at), parseISO(dateFilter))) return false;
    }

    return true;
  });

  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()));

  const now = new Date();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      
      {/* LEFT PANEL: Daily Actions (Tasks) */}
      <div className="w-full lg:w-5/12 xl:w-1/3 flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-teal-500" />
              Daily Actions
            </h2>
          </div>
          
          {/* Filters Row */}
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
            
            <div className="relative flex items-center">
              <Calendar size={14} className="absolute left-2 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-7 pr-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 border-transparent rounded-md text-slate-600 dark:text-slate-300 focus:border-teal-500 focus:ring-teal-500"
              />
              {dateFilter && (
                <button onClick={() => setDateFilter('')} className="ml-1 text-slate-400 hover:text-red-500 text-xs px-1">Clear</button>
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
            
            {/* Multiple Tags Chips */}
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
              
              return (
                <div 
                  key={task.id} 
                  className={`group flex items-start gap-3 p-3 rounded-lg transition-colors border ${
                    task.is_completed 
                      ? 'bg-slate-50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/50 opacity-70 hover:opacity-100' 
                      : isOverdue
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                  }`}
                >
                  <button 
                    onClick={() => toggleTaskCompletion(task.id, task.is_completed)} 
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
                    
                    <div className="flex flex-wrap gap-1.5 mt-2">
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
                    </div>
                  </div>
                  
                  <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1">
                    <Trash2 size={14} />
                  </button>
                  
                  {/* Explicit Green Checkmark UI for completed items (on the right) */}
                  {task.is_completed && (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Brain Dump (Notes) */}
      <div className="w-full lg:w-7/12 xl:w-2/3 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header & Search */}
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

        {/* Note Grid Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* Note Composer */}
          <div className="mb-8">
            {!isAddingNote ? (
              <button 
                onClick={() => setIsAddingNote(true)}
                className="w-full max-w-xl mx-auto block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-4 text-left text-slate-500 dark:text-slate-400 hover:shadow-md transition-shadow cursor-text"
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

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
            {filteredNotes.map(note => (
              <div key={note.id} className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col">
                <button 
                  onClick={() => deleteNote(note.id)}
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
                <div className="text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                  {new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </div>
    </div>
  );
}
