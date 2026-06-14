import { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Mail, Lock, User, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';

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

  const handleQuickDemo = async () => {
    setEmail('demo@hn.com');
    setPassword('demopass123');
    try {
      await login('demo@hn.com', 'demopass123');
      onSuccess?.();
    } catch (err) {
      onGuestMode?.();
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background radial gradient glow for a premium feel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-sm space-y-6 z-10">
        
        {/* Branding header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-black text-base tracking-tighter select-none">
            HN
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-white leading-none">
              {isRegister ? 'Create your HN account' : 'Sign in to HN'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isRegister ? 'Enter your details below to get started' : 'Welcome back. Please enter your details.'}
            </p>
          </div>
        </div>

        {/* Auth Card Panel */}
        <div className="bg-slate-900/30 backdrop-blur-xl border border-white/[0.06] p-6 rounded-2xl shadow-xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center">
                {error}
              </div>
            )}

            {isRegister && (
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-400">
                  Name
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 inset-y-0 flex items-center text-slate-500 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                    className="w-full bg-slate-950/40 border border-white/[0.08] focus:border-indigo-500 text-white rounded-xl py-2 pr-4 text-xs placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/30 transition-all outline-none"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-400">
                Email address
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 inset-y-0 flex items-center text-slate-500 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                  className="w-full bg-slate-950/40 border border-white/[0.08] focus:border-indigo-500 text-white rounded-xl py-2 pr-4 text-xs placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/30 transition-all outline-none"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-medium text-slate-400">
                  Password
                </label>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 inset-y-0 flex items-center text-slate-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '38px', paddingRight: '36px' }}
                  className="w-full bg-slate-950/40 border border-white/[0.08] focus:border-indigo-500 text-white rounded-xl py-2 text-xs placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/30 transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white hover:bg-slate-200 text-slate-950 font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-900" /> Authenticating...
                </>
              ) : (
                <>
                  {isRegister ? 'Sign up' : 'Sign in'} <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle link */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                useAuthStore.setState({ error: null });
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors outline-none cursor-pointer"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        {/* Demo & Guest shortcuts */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-px bg-white/5 flex-1" />
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Bypass Actions</span>
            <div className="h-px bg-white/5 flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleQuickDemo}
              className="py-2 rounded-xl bg-slate-900/30 border border-white/[0.06] hover:bg-slate-800/40 text-xs text-slate-300 font-semibold hover:text-white transition-all flex items-center justify-center gap-1">
              🚀 Try Demo
            </button>
            <button
              onClick={onGuestMode}
              className="py-2 rounded-xl bg-slate-900/30 border border-white/[0.06] hover:bg-slate-800/40 text-xs text-slate-300 font-semibold hover:text-white transition-all flex items-center justify-center gap-1">
              🌐 Use Offline
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
