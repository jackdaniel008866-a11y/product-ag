import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  group?: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export default function MultiSelectDropdown({ label, options, selectedValues, onChange }: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedCount = selectedValues.length;

  // Group options if any have group specified
  const hasGroups = options.some(o => o.group);
  const renderOptions = () => {
    if (!hasGroups) {
      return options.map(opt => (
        <button
          key={opt.value}
          onClick={() => toggleOption(opt.value)}
          className="w-full text-left px-3 py-2 text-sm flex items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 shrink-0 ${
            selectedValues.includes(opt.value) 
              ? 'bg-teal-500 border-teal-500 text-white' 
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
          }`}>
            {selectedValues.includes(opt.value) && <Check size={12} strokeWidth={3} />}
          </div>
          <span className="text-slate-700 dark:text-slate-200 truncate">{opt.label}</span>
        </button>
      ));
    }

    const groups = Array.from(new Set(options.map(o => o.group || 'Other')));
    return groups.map(group => (
      <div key={group} className="py-1">
        <div className="px-3 py-1 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/20">{group}</div>
        {options.filter(o => (o.group || 'Other') === group).map(opt => (
          <button
            key={opt.value}
            onClick={() => toggleOption(opt.value)}
            className="w-full text-left px-3 py-2 text-sm flex items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors pl-4"
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 shrink-0 ${
              selectedValues.includes(opt.value) 
                ? 'bg-teal-500 border-teal-500 text-white' 
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
            }`}>
              {selectedValues.includes(opt.value) && <Check size={12} strokeWidth={3} />}
            </div>
            <span className="text-slate-700 dark:text-slate-200 truncate">{opt.label}</span>
          </button>
        ))}
      </div>
    ));
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-full flex items-center justify-between text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors min-w-[140px]"
      >
        <div className="flex items-center truncate">
          <span className="truncate">{selectedCount > 0 ? `${label} (${selectedCount})` : `All ${label}s`}</span>
        </div>
        <div className="flex items-center ml-2 shrink-0">
          {selectedCount > 0 && (
            <div 
              onClick={clearAll}
              className="mr-1 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </div>
          )}
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-1 left-0 w-56 max-h-64 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="py-1">
            {renderOptions()}
          </div>
        </div>
      )}
    </div>
  );
}
