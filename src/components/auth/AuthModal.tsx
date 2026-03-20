import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AuthModal() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State 
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (!isLogin) {
        // Validation for Signup
        if (!email.toLowerCase().endsWith('@vfirst.com')) {
          setError("Access restricted to authorized @vfirst.com domains only.");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }
        if (!firstName.trim() || !lastName.trim()) {
          setError("First and last name are required.");
          setLoading(false);
          return;
        }

        // Trigger Signup
        const name = `${firstName.trim()} ${lastName.trim()}`;
        const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: name
            }
          }
        });

        if (signUpError) throw signUpError;
        
        // Auto-provision user into the Team table seamlessly
        if (data.user) {
          const { error: insertError } = await supabase.from('users').upsert({
            id: data.user.id,
            name: name,
            initials: initials
          });
          if (insertError) console.error("Could not auto-provision team user:", insertError);
          
          // Show email confirmation message
          setSuccessMessage(`Account created successfully! We just sent a verification link to ${email}. Please check your inbox and confirm your email before signing in.`);
          
          // Reset fields and toggle to login
          setIsLogin(true);
          setPassword('');
          setConfirmPassword('');
        }

      } else {
        // Trigger Login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/valuefirst-logo.png" alt="Valuefirst Logo" className="h-16 object-contain mb-8" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2 whitespace-nowrap">Surbo / Surbo Chat</h1>
          <h2 className="text-lg font-semibold tracking-tight text-teal-600 mb-4">Product Management Tracker</h2>
          <p className="text-slate-500 font-medium">
            {isLogin ? "Sign in to access the workspace." : "Create your team account."}
          </p>
        </div>

        <div className={`bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 md:p-8 transition-all duration-300 ${error ? 'border-red-300 shadow-red-100' : ''}`}>
          <form onSubmit={handleAuth} className="space-y-4">
            
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-slate-900"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Corporate Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@vfirst.com"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-slate-900"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-slate-900"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-start gap-2 text-sm font-medium animate-in fade-in">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-100/50 text-emerald-700 px-4 py-3.5 rounded-lg flex items-start gap-2.5 text-sm font-medium animate-in fade-in transition-all">
                <span className="text-emerald-500 shrink-0 text-xl leading-none">✉️</span>
                <span className="leading-snug">{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl py-4 font-semibold transition-all active:scale-[0.98] shadow-sm hover:shadow-md mt-6"
            >
              <span>{loading ? "Authenticating..." : (isLogin ? "Sign In" : "Register Account")}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-sm text-slate-500 hover:text-slate-800 font-semibold transition-colors"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-8 font-medium">
          Authorized personnel only. Product OS limits access to verified internal domains.
        </p>
      </div>
    </div>
  );
}
