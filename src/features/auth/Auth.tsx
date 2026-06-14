import { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Sparkles, Mail, Lock, User, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface AuthProps {
  onSuccess?: () => void;
  onGuestMode?: () => void;
}

export function Auth({ onSuccess, onGuestMode }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  // Prefill demo account credentials for easy testing
  const handleQuickDemo = async () => {
    setEmail('demo@hn.com');
    setPassword('demopass123');
    try {
      await login('demo@hn.com', 'demopass123');
      onSuccess?.();
    } catch (err) {
      // Fallback to offline guest mode if backend server is not running
      onGuestMode?.();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 auth-bg relative overflow-hidden bg-slate-950">
      {/* Premium background glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-60 h-60 md:w-80 md:h-80 bg-indigo-600/15 rounded-full filter blur-[80px] md:blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-60 h-60 md:w-80 md:h-80 bg-rose-500/10 rounded-full filter blur-[80px] md:blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Main glassmorphism card wrapper */}
      <div className="w-full max-w-sm bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] p-5 md:p-7 rounded-2xl shadow-2xl space-y-5 z-10 relative">
        
        {/* Branding Logo & Title */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 mb-1">
            <span className="text-lg font-black tracking-tight">HN</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
            {isRegister ? 'Join HN Cockpit' : 'Welcome to HN'}
          </h1>
          <p className="text-slate-400 text-[11px] md:text-xs max-w-[280px] mx-auto leading-relaxed">
            {isRegister
              ? 'Start tracking goals, habits, and health in one place.'
              : 'Sign in to access your habits, planner and AI coach.'}
          </p>
        </div>

        {/* Input fields form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center animate-shake">
              {error}
            </div>
          )}

          {isRegister && (
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-slate-300 pl-0.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-2 pl-9 pr-4 text-xs placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 outline-none"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-slate-300 pl-0.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-2 pl-9 pr-4 text-xs placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 outline-none"
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-slate-300 pl-0.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-2 pl-9 pr-9 text-xs placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 outline-none"
                placeholder="********"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/15 transition-all duration-150 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
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

        {/* Guest and Quick Sign-In Options */}
        <div className="space-y-3 pt-3.5 border-t border-white/5 text-center">
          <p className="text-xs text-slate-400">
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                useAuthStore.setState({ error: null });
              }}
              className="text-indigo-400 hover:text-indigo-300 font-bold ml-1 outline-none cursor-pointer transition-colors"
            >
              {isRegister ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleQuickDemo}
              className="py-1.5 rounded-lg bg-slate-800 text-[10px] text-gray-300 font-semibold hover:bg-slate-700 transition-colors">
              🚀 Try Demo
            </button>
            <button
              onClick={onGuestMode}
              className="py-1.5 rounded-lg bg-slate-800 text-[10px] text-gray-300 font-semibold hover:bg-slate-700 transition-colors">
              🌐 Use Offline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
