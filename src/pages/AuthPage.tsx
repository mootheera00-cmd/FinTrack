import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Mode = 'signin' | 'signup';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isSignUp = mode === 'signup';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) throw error;
        setSuccessMsg('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Auth state change in useAuth will redirect automatically
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      // Translate common Supabase error messages
      if (msg.includes('Invalid login credentials')) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (msg.includes('Email not confirmed')) {
        setError('กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ — ตรวจสอบ inbox ของคุณ หรือติดต่อผู้ดูแลระบบ');
      } else if (msg.includes('User already registered')) {
        setError('อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ');
      } else if (msg.includes('Password should be at least')) {
        setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      } else if (msg.includes('Unable to validate email')) {
        setError('รูปแบบอีเมลไม่ถูกต้อง');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(isSignUp ? 'signin' : 'signup');
    setError('');
    setSuccessMsg('');
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top gradient decoration */}
      <div
        className="h-64 flex-shrink-0 flex flex-col items-center justify-end pb-8"
        style={{ background: 'linear-gradient(135deg, #FFBF00 0%, #f59e0b 60%, #d97706 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-full h-64 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute top-20 -left-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />
        </div>

        {/* Logo */}
        <div className="relative flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-slate-900/15 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg">
            <Wallet size={32} className="text-slate-900" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">FinTrack</h1>
            <p className="text-sm text-slate-800/70 mt-0.5">Personal Finance Manager</p>
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                !isSignUp
                  ? 'text-brand-500 border-b-2 border-brand-500 bg-amber-50/50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                isSignUp
                  ? 'text-brand-500 border-b-2 border-brand-500 bg-amber-50/50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              สมัครสมาชิก
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {/* Display name (signup only) */}
            {isSignUp && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  ชื่อที่แสดง
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="เช่น สมชาย ใจดี"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required={isSignUp}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                อีเมล
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  inputMode="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isSignUp ? 'อย่างน้อย 6 ตัวอักษร' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Success message */}
            {successMsg && (
              <div className="flex items-start gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                <span className="mt-0.5">✅</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {isSignUp ? 'กำลังสมัคร...' : 'กำลังเข้าสู่ระบบ...'}
                </span>
              ) : (
                isSignUp ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'
              )}
            </button>

            {/* Switch mode link */}
            <p className="text-center text-sm text-slate-500">
              {isSignUp ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'}{' '}
              <button
                type="button"
                onClick={switchMode}
                className="font-semibold text-brand-500 hover:text-brand-600 transition-colors"
              >
                {isSignUp ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
              </button>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6 mb-8 pb-safe">
          ข้อมูลของคุณถูกเก็บอย่างปลอดภัยด้วย Supabase RLS 🔒
        </p>
      </div>
    </div>
  );
}
