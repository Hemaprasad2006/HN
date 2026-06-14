import { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Bot, Sparkles, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
      {/* Background radial glowing gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md glass-card p-8 space-y-6 z-10 border border-white/10 relative">
        {/* App Title & Branding */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/20 mx-auto">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">LifeOS</h1>
          <p className="text-gray-400 text-sm">Become 1% better every day. Your growth cockpit.</p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {isRegister && (
            <div className="relative">
              <label className="block text-2xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Your Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-2xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-2xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 mt-2"
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

        {/* Toggle option between login/register */}
        <div className="space-y-4 pt-4 border-t border-white/5 text-center">
          <p className="text-xs text-gray-400">
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                useAuthStore.setState({ error: null });
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {isRegister ? 'Log In' : 'Sign Up'}
            </button>
          </p>

          <button
            onClick={onGuestMode}
            className="text-xs text-gray-500 hover:text-gray-400 underline block mx-auto transition-colors"
          >
            Continue as Guest (Offline Mode)
          </button>
        </div>
      </div>
    </div>
  );
}
