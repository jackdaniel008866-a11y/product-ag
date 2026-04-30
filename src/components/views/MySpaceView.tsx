import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Tag, Search, StickyNote, Check } from 'lucide-react';
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
  const [newTaskTag, setNewTaskTag] = useState<PersonalTaskTag>('General');

  // Note Input State
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadPersonalData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const [tasksRes, notesRes] = await Promise.all([
        supabase.from('personal_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('personal_notes').select('*').order('created_at', { ascending: false })
      ]);

      if (tasksRes.data) setTasks(tasksRes.data);
      if (notesRes.data) setNotes(notesRes.data);
      setIsLoading(false);
    }
    loadPersonalData();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim() || !userId) return;

    const newTask = {
      user_id: userId,
      content: newTaskContent.trim(),
      product_tag: newTaskTag,
      is_completed: false
    };

    const tempId = `temp-${Date.now()}`;
    const optimisticTask: PersonalTask = { ...newTask, id: tempId, created_at: new Date().toISOString() };
    setTasks(prev => [optimisticTask, ...prev]);
    setNewTaskContent('');

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

  const filteredTasks = tasks.filter(t => t.content.toLowerCase().includes(searchQuery.toLowerCase()) || t.product_tag.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()));

  const activeTasks = filteredTasks.filter(t => !t.is_completed);
  const completedTasks = filteredTasks.filter(t => t.is_completed);

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
      <div className="w-full lg:w-1/3 flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-teal-500" />
            Daily Actions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Private to-do list.</p>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <form onSubmit={handleAddTask} className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTaskContent}
              onChange={(e) => setNewTaskContent(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg px-3 py-2 text-sm focus:border-teal-500 focus:ring-teal-500 dark:text-slate-200"
            />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <select
                  value={newTaskTag}
                  onChange={(e) => setNewTaskTag(e.target.value as PersonalTaskTag)}
                  className="w-full pl-8 bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:border-teal-500 focus:ring-teal-500 appearance-none"
                >
                  {TAGS.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                </select>
              </div>
              <button 
                type="submit" 
                disabled={!newTaskContent.trim()}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white p-1.5 rounded-lg transition-colors flex items-center justify-center"
              >
                <Plus size={18} />
              </button>
            </div>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTasks.length === 0 && completedTasks.length === 0 && (
            <div className="text-center text-slate-400 text-sm mt-8">All caught up!</div>
          )}
          
          <div className="space-y-2">
            {activeTasks.map(task => (
              <div key={task.id} className="group flex items-start gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                <button onClick={() => toggleTaskCompletion(task.id, task.is_completed)} className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-teal-500 transition-colors">
                  <Circle size={18} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 dark:text-slate-200">{task.content}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-500 dark:text-slate-400 rounded">
                    {task.product_tag}
                  </span>
                </div>
                <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {completedTasks.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Completed</h3>
                {completedTasks.map(task => (
                  <div key={task.id} className="group flex items-start gap-3 p-2 rounded-lg opacity-60 hover:opacity-100 transition-opacity">
                    <button onClick={() => toggleTaskCompletion(task.id, task.is_completed)} className="mt-0.5 flex-shrink-0 text-teal-500">
                      <CheckCircle2 size={18} />
                    </button>
                    <div className="flex-1 min-w-0 line-through">
                      <p className="text-sm text-slate-600 dark:text-slate-400">{task.content}</p>
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Brain Dump (Notes) */}
      <div className="w-full lg:w-2/3 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <StickyNote size={20} className="text-amber-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Brain Dump</h2>
          </div>
          <div className="relative w-64">
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
