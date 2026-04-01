import { useState, useEffect, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Search, FileText } from 'lucide-react';
import type { Initiative } from '../../types';
import { clsx } from 'clsx';

interface GlobalSearchProps {
  initiatives: Initiative[];
  onSelect: (id: string) => void;
}

export default function GlobalSearch({ initiatives, onSelect }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce user input by 150ms to prevent UI lagging while typing fast
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Fuse index. 
  // Scalability Note: At <5,000 initiatives, client-side indexing via useMemo is virtually instantaneous. 
  // For >10,000, we would migrate this explicit logic to a Supabase Postgres RPC using pg_trgm.
  const fuse = useMemo(() => new Fuse(initiatives, {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'description', weight: 0.3 }
    ],
    includeMatches: true,
    threshold: 0.4, // Allows slight typos like "intigretion" -> "integration"
    ignoreLocation: true,
    minMatchCharLength: 2
  }), [initiatives]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    // Limit DOM renders to 8 items to keep dropdown extremely responsive
    return fuse.search(debouncedQuery).slice(0, 8);
  }, [debouncedQuery, fuse]);

  // Handle keyboard navigation natively
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex].item.id);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Keyboard shortcut CMD+K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSelect = (id: string) => {
    setIsOpen(false);
    setQuery('');
    setDebouncedQuery('');
    onSelect(id);
  };

  // Highlight matches using parsed fuse.js indices safely
  const renderHighlightedText = (text: string | undefined, matches: ReadonlyArray<{ indices: ReadonlyArray<[number, number]> }> | undefined) => {
    if (!text) return null;
    if (!matches || matches.length === 0) return <span>{text}</span>;

    // We only use the first match object for the exact key usually, fuse handles the grouping natively
    const allIndices = matches.flatMap(m => m.indices);
    // Merge overlapping intervals
    const mergedIntervals = [...allIndices].sort((a, b) => a[0] - b[0]).reduce((acc, curr) => {
      if (acc.length === 0) return [curr];
      const last = acc[acc.length - 1];
      if (curr[0] <= last[1] + 1) {
        last[1] = Math.max(last[1], curr[1]);
      } else {
        acc.push(curr);
      }
      return acc;
    }, [] as [number, number][]);

    const parts = [];
    let lastIndex = 0;
    mergedIntervals.forEach(([start, end], i) => {
      if (start > lastIndex) {
        parts.push(<span key={`t-${i}`} className="text-slate-800 dark:text-slate-200">{text.slice(lastIndex, start)}</span>);
      }
      parts.push(<span key={`m-${i}`} className="bg-amber-200/50 dark:bg-amber-500/30 text-indigo-900 dark:text-amber-100 font-bold px-0.5 rounded">{text.slice(start, end + 1)}</span>);
      lastIndex = end + 1;
    });
    if (lastIndex < text.length) {
      parts.push(<span key="end" className="text-slate-800 dark:text-slate-200">{text.slice(lastIndex)}</span>);
    }
    
    return parts;
  };

  return (
    <div className="flex-1 max-w-xl px-12 relative hidden md:block" ref={containerRef}>
      <div className="relative group">
        <Search className={clsx(
          "absolute left-3 top-1/2 -translate-y-1/2 transition-colors",
          isOpen ? "text-teal-500" : "text-slate-400 group-focus-within:text-teal-500"
        )} size={16} />
        
        <input 
          ref={inputRef}
          type="text" 
          placeholder="Search initiatives, notes, or tags... (Cmd+K)" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-900 border focus:border-teal-500 border-transparent dark:focus:border-teal-500/50 dark:border-transparent rounded-lg pl-9 pr-4 py-1.5 text-sm outline-none transition-all focus:ring-4 focus:ring-teal-500/10 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-slate-800 dark:text-slate-100"
        />

        {isOpen && debouncedQuery && (
          <div className="absolute top-10 left-12 right-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
            {results.length === 0 ? (
              <div className="p-4 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm py-8 flex-col space-y-2">
                <Search size={24} className="opacity-20 text-slate-400 dark:text-slate-500" />
                <p>No initiatives found for "<span className="font-semibold">{debouncedQuery}</span>"</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Try adjusting your spelling</p>
              </div>
            ) : (
              <ul className="py-1.5">
                {results.map((result, index) => {
                  const init = result.item;
                  const titleMatch = result.matches?.find(m => m.key === 'title');
                  const descMatch = result.matches?.find(m => m.key === 'description');
                  
                  return (
                    <li 
                      key={init.id}
                      className={clsx(
                        "px-4 py-2.5 cursor-pointer flex flex-col transition-colors border-l-2",
                        index === selectedIndex ? "bg-slate-50 dark:bg-slate-800 border-teal-500" : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent"
                      )}
                      onClick={() => handleSelect(init.id)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {renderHighlightedText(init.title, titleMatch ? [titleMatch] : undefined)}
                        </span>
                        
                        <div className="flex items-center space-x-1.5 shrink-0 ml-3">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {init.type}
                          </span>
                          <span className={clsx(
                            "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                            init.status === 'Active' ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 
                            init.status === 'Blocked' ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20' : 
                            'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                          )}>
                            {init.status}
                          </span>
                        </div>
                      </div>
                      
                      {descMatch && !titleMatch ? (
                        <div className="flex items-start text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 opacity-90">
                          <FileText size={10} className="mr-1 mt-0.5 shrink-0" />
                          <span className="italic">{renderHighlightedText(init.description, [descMatch])}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
                          {init.product} • {init.stage}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-4 w-full transition-colors">
               <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">Esc to close</span>
               <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 flex items-center space-x-2">
                 <span>↑↓ to navigate</span>
                 <span>Enter to select</span>
               </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
