import { useState } from 'react';
import type { FormEvent } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

interface PasswordPromptProps {
  onSuccess: () => void;
}

export default function PasswordPrompt({ onSuccess }: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === '6787') {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setPassword('');
      // Shake animation class will be applied via CSS
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-200 mb-6 text-slate-800">
            <Lock size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Product OS</h1>
          <p className="text-slate-500 font-medium">Please enter the passcode to access the workspace.</p>
        </div>

        <div className={`bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 md:p-8 transition-all duration-300 ${error ? 'border-red-300 shadow-red-100' : ''}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="passcode" className="sr-only">Passcode</label>
              <div className="relative">
                <input
                  id="passcode"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter passcode..."
                  className={`w-full px-5 py-4 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-lg tracking-widest text-center font-medium ${
                    error 
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 text-red-900' 
                      : 'border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900'
                  }`}
                  autoFocus
                />
              </div>
              {error && (
                <p className="mt-3 text-sm text-red-500 font-medium text-center animate-in fade-in">
                  Incorrect passcode. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-4 font-semibold transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
            >
              <span>Access Workspace</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-8 font-medium">
          Authorized personnel only.
        </p>
      </div>
    </div>
  );
}
