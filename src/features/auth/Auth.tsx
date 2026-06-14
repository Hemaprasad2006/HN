import { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Sparkles, Mail, Lock, User, Loader2, ArrowRight, Eye, EyeOff, CheckCircle2, Trophy, Brain, Calendar } from 'lucide-react';

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
    <div className="min-h-screen w-full flex flex-col md:flex-row auth-bg bg-slate-950 relative overflow-hidden">
      
      {/* LEFT PANEL: Branding & Feature Tour (Hidden on mobile) */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 flex-col justify-between p-10 lg:p-14 bg-gradient-to-br from-indigo-950/80 via-slate-950 to-indigo-950/30 border-r border-white/[0.06] relative overflow-hidden">
        {/* Glow meshes */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-600/10 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-violet-600/10 rounded-full filter blur-[100px] pointer-events-none" />

        {/* Top: Branding logo */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="text-sm font-black tracking-tighter">HN</span>
          </div>
          <span className="text-lg font-black text-white tracking-wide">HN Life Cockpit</span>
        </div>

        {/* Middle: Feature highlights */}
        <div className="space-y-6 max-w-lg my-auto relative z-10">
          <div className="space-y-2.5">
            <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Version 2.0 Live
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-white leading-none tracking-tight">
              Level up your life, <br />one block at a time.
            </h2>
            <p className="text-slate-400 text-xs lg:text-sm leading-relaxed">
              Unlock a gamified ecosystem built to track your daily habits, organize tasks, log learning hours, and monitor health metrics.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            {[
              { title: 'Gamified Progress & XP', desc: 'Gain experience points (XP) for completing daily tasks and study sessions.', icon: <Trophy className="w-4 h-4 text-amber-400" /> },
              { title: 'AI Growth Coach', desc: 'Consult your custom AI coach with direct context on your logs and trends.', icon: <Brain className="w-4 h-4 text-violet-400" /> },
              { title: 'Comprehensive Analytics', desc: 'View MoM performance improvements, study heatmaps, and correlations.', icon: <Sparkles className="w-4 h-4 text-cyan-400" /> },
            ].map((f, i) => (
              <div key={i} className="flex gap-3 items-start bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl hover:bg-white/[0.04] transition-all">
                <div className="p-1.5 rounded-lg bg-slate-900 border border-white/5 shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{f.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Footer quote */}
        <div className="relative z-10 text-[11px] text-slate-500">
          Developed by HN Crew. All data stays secure and synced.
        </div>
      </div>

      {/* RIGHT PANEL: Form & Action shortcuts (Fills screen on mobile) */}
      <div className="flex-1 flex flex-col justify-between p-6 md:p-10 lg:p-14 relative z-10 min-h-screen">
        
        {/* Glow orb for mobile */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/10 rounded-full filter blur-[100px] pointer-events-none md:hidden" />

        {/* Header bar: show logo on mobile only */}
        <div className="flex items-center justify-between md:justify-end shrink-0">
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center">
              <span className="text-xs font-black">HN</span>
            </div>
            <span className="text-xs font-bold text-white">Life Cockpit</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">Offline mode supported</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Center: Auth Card */}
        <div className="w-full max-w-sm mx-auto my-auto py-6 space-y-5">
          <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none">
              {isRegister ? 'Start Your Journey' : 'Welcome Back'}
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              {isRegister 
                ? 'Create a secure account to sync your planner across devices.'
                : 'Sign in to access your dashboard, metrics, and targets.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center animate-shake">
                {error}
              </div>
            )}

            {isRegister && (
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-300 pl-0.5">
                  Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-2.5 pl-9 pr-4 text-xs placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 outline-none"
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
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-2.5 pl-9 pr-4 text-xs placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 outline-none"
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
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-2.5 pl-9 pr-9 text-xs placeholder-slate-600 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200 outline-none"
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
                  {isRegister ? 'Register Account' : 'Sign In'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center">
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
        </div>

        {/* Bottom shortcuts: Try Demo / Continue Offline */}
        <div className="space-y-2 shrink-0 max-w-sm w-full mx-auto">
          <div className="flex items-center gap-2 my-1">
            <div className="h-px bg-white/5 flex-1" />
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Bypass Options</span>
            <div className="h-px bg-white/5 flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleQuickDemo}
              className="py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] text-xs text-gray-300 font-bold hover:text-white transition-all flex items-center justify-center gap-1">
              🚀 Try Demo
            </button>
            <button
              onClick={onGuestMode}
              className="py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] text-xs text-gray-300 font-bold hover:text-white transition-all flex items-center justify-center gap-1">
              🌐 Use Offline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
