import { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Sparkles, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';

interface AuthProps {
  onSuccess?: () => void;
  onGuestMode?: () => void;
}

export function Auth({ onSuccess, onGuestMode }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      onSuccess?.();
    } catch (err) {
      console.error('Authentication error:', err);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 auth-bg relative overflow-hidden">
      {/* Main glassmorphism card wrapper */}
      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] p-8 rounded-2xl shadow-2xl space-y-6 z-10 relative">
        {/* Branding Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {isRegister ? 'Create your account' : 'Sign in to HN'}
          </h1>
          <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
            {isRegister
              ? 'Get started with your personal productivity cockpit today.'
              : 'Enter your credentials below to access your dashboard.'}
          </p>
        </div>

        {/* Input fields form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center animate-shake">
              {error}
            </div>
          )}

          {isRegister && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider pl-0.5">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-3 px-4 text-sm placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 outline-none"
                placeholder="John Doe"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider pl-0.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-3 px-4 text-sm placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 outline-none"
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider pl-0.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-3 px-4 text-sm placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/15 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
              </>
            ) : (
              <>
                {isRegister ? 'Create Account' : 'Sign In'} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle options */}
        <div className="space-y-4 pt-4 border-t border-white/5 text-center">
          <p className="text-sm text-slate-400">
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                useAuthStore.setState({ error: null });
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold ml-1 outline-none cursor-pointer transition-colors"
            >
              {isRegister ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          <button
            onClick={onGuestMode}
            className="text-xs text-slate-500 hover:text-slate-400 hover:underline block mx-auto transition-colors outline-none cursor-pointer font-medium"
          >
            Continue as Guest (Offline Mode)
          </button>
        </div>
      </div>
    </div>
  );
}
