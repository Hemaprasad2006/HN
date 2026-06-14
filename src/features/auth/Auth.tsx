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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background glowing blurred mesh circles */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl" />

      {/* Main glassmorphism card wrapper */}
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl shadow-2xl space-y-7 z-10 relative">
        {/* Branding Logo & Title */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-xl shadow-indigo-500/20 mx-auto animate-float">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
            HN
          </h1>
          <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
            Your premium companion for habits, studies, health, and routines.
          </p>
        </div>

        {/* Input fields form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {isRegister && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
                Your Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/45 border border-white/10 hover:border-white/20 text-white rounded-xl py-3 pl-11 pr-4 text-sm placeholder-white/25 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/45 border border-white/10 hover:border-white/20 text-white rounded-xl py-3 pl-11 pr-4 text-sm placeholder-white/25 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 outline-none"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/45 border border-white/10 hover:border-white/20 text-white rounded-xl py-3 pl-11 pr-4 text-sm placeholder-white/25 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
              </>
            ) : (
              <>
                {isRegister ? 'Register Account' : 'Log In'} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle options */}
        <div className="space-y-4 pt-4 border-t border-white/5 text-center">
          <p className="text-xs text-slate-400">
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                useAuthStore.setState({ error: null });
              }}
              className="text-indigo-400 hover:text-indigo-300 font-bold ml-1 outline-none cursor-pointer transition-colors"
            >
              {isRegister ? 'Log In' : 'Sign Up'}
            </button>
          </p>

          <button
            onClick={onGuestMode}
            className="text-xs text-indigo-400/85 hover:text-indigo-400 hover:underline block mx-auto transition-colors outline-none cursor-pointer font-medium"
          >
            Continue as Guest (Offline Mode)
          </button>
        </div>
      </div>
    </div>
  );
}
