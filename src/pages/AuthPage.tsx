import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Wallet, ArrowLeft, LogOut, Cloud, CheckCircle, Key, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useData } from '@/hooks/useData';
import { useNavigate } from 'react-router-dom';

type Mode = 'signin' | 'signup' | 'forgot';

export default function AuthPage() {
  const ctx = useData();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sessionUser = (ctx as any).sessionUser ?? null;

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [mergeDataOnSignIn, setMergeDataOnSignIn] = useState(true);

  const isForgot = mode === 'forgot';

  const isSignUp = mode === 'signup';

  // Check if logged in permanently
  const isPermanentUser = sessionUser && !sessionUser.is_anonymous;

  // Check if there is local data on this anonymous session to merge
  const hasLocalData = ctx.incomes.length > 0 || ctx.expenses.length > 0 || ctx.installments.length > 0 || ctx.sharedExpenses.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Upgrading an anonymous user to permanent, or standard signUp if no anonymous session
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) throw error;
        
        setSuccessMsg('สมัครสมาชิกสำเร็จ! ข้อมูลของคุณได้รับการซิงค์เรียบร้อยแล้ว');
        // Redirect after a short delay
        setTimeout(() => navigate('/'), 2000);
      } else {
        // Sign In & optionally Merge Local Data
        const localIncomes = [...ctx.incomes];
        const localExpenses = [...ctx.expenses];
        const localInstallments = [...ctx.installments];
        const localShared = [...ctx.sharedExpenses];

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        if (mergeDataOnSignIn && data.user && hasLocalData) {
          const newUserId = data.user.id;
          
          if (localIncomes.length > 0) {
            await supabase.from('income').insert(
              localIncomes.map(({ id, created_at, updated_at, user_id, ...rest }) => ({
                ...rest,
                user_id: newUserId
              }))
            );
          }
          if (localExpenses.length > 0) {
            await supabase.from('expenses').insert(
              localExpenses.map(({ id, created_at, updated_at, user_id, ...rest }) => ({
                ...rest,
                user_id: newUserId
              }))
            );
          }
          if (localInstallments.length > 0) {
            await supabase.from('installments_v2').insert(
              localInstallments.map(({ id, created_at, updated_at, user_id, ...rest }) => ({
                ...rest,
                user_id: newUserId
              }))
            );
          }
          if (localShared.length > 0) {
            await supabase.from('shared_expenses').insert(
              localShared.map(({ id, created_at, updated_at, user_id, ...rest }) => ({
                ...rest,
                user_id: newUserId
              }))
            );
          }
        }

        await ctx.refetchAll();
        navigate('/');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      console.error('Auth error:', err);
      if (msg.includes('Invalid login credentials')) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง\n\n💡 หากเพิ่งสมัครใหม่ อาจต้องยืนยันอีเมลก่อน ลองกด "ลืมรหัสผ่าน" เพื่อตั้งรหัสผ่านใหม่ผ่าน inbox ของคุณ');
      } else if (msg.includes('Email not confirmed')) {
        setError('กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ — ตรวจสอบ inbox ของคุณ');
      } else if (msg.includes('User already registered')) {
        setError('อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้เมนู "เข้าสู่ระบบ"');
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

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth',
      });
      if (error) throw error;
      setSuccessMsg('ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยัง ' + email + ' แล้ว — ตรวจสอบ inbox ของคุณ');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      // On sign out, DataContext will auto-sign-in anonymously again
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'ออกจากระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top gradient decoration */}
      <div
        className="h-64 flex-shrink-0 flex flex-col items-center justify-end pb-8 relative bg-neutral-900"
      >
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center gap-1 text-sm font-semibold"
          title="กลับหน้าหลัก"
        >
          <ArrowLeft size={18} />
          กลับ
        </button>

        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-full h-64 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute top-20 -left-8 w-32 h-32 rounded-full bg-white/5 blur-xl" />
        </div>

        {/* Logo */}
        <div className="relative flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg">
            <Wallet size={32} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">บันทึกรายรับ-รายจ่าย</h1>
            <p className="text-sm text-white/60 mt-0.5">Personal Finance Manager</p>
          </div>
        </div>
      </div>

      {/* Card Container */}
      <div className="flex-1 flex flex-col px-4 -mt-6 relative z-10 max-w-md w-full mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-neutral-200/80 overflow-hidden">
          {isPermanentUser ? (
            /* Logged In Profile State */
            <div className="p-6 flex flex-col gap-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-neutral-100 text-neutral-500 rounded-full flex items-center justify-center border border-neutral-200 shadow-inner">
                  <CheckCircle size={36} />
                </div>
                <h2 className="text-xl font-bold text-neutral-900">บัญชีซิงค์ข้อมูลแล้ว</h2>
                <p className="text-sm text-neutral-500">
                  ยินดีต้อนรับคุณ <span className="font-semibold text-neutral-800">{ctx.profile?.display_name || displayName || sessionUser.email}</span>
                </p>
              </div>

              <div className="bg-neutral-50 rounded-2xl p-4 text-left border border-neutral-100 space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">อีเมลบัญชี</span>
                  <span className="font-medium text-neutral-800">{sessionUser.email}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">สถานะคลาวด์</span>
                  <span className="text-neutral-700 font-semibold flex items-center gap-1">
                    <Cloud size={14} /> ซิงค์เรียบร้อย
                  </span>
                </div>
              </div>

              <div className="text-xs text-neutral-400 leading-relaxed px-2">
                ข้อมูลการเงินของคุณถูกเก็บไว้ในระบบคลาวด์อย่างปลอดภัย คุณสามารถเข้าสู่ระบบด้วยอีเมลนี้บนไอโฟนหรือแท็บเล็ตเพื่อดูข้อมูลเดียวกันได้ทันที
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-sm"
                >
                  กลับหน้าหลัก
                </button>
                
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 active:scale-[0.98] text-neutral-600 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  {loading ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
                </button>
              </div>
            </div>
          ) : (
            /* Auth Form (SignIn / SignUp) */
            <>
              {/* Tab switcher */}
              <div className="flex border-b border-neutral-200">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                    !isSignUp && !isForgot
                      ? 'text-neutral-900 border-b-2 border-neutral-900 bg-neutral-50'
                      : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                    isSignUp
                      ? 'text-neutral-900 border-b-2 border-neutral-900 bg-neutral-50'
                      : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  สมัครสมาชิก
                </button>
              </div>

              {/* Form */}
              {isForgot ? (
                /* Forgot Password Form */
                <form onSubmit={handleForgotPassword} className="p-6 flex flex-col gap-4">
                  <div className="text-center">
                    <Key size={36} className="text-neutral-400 mx-auto mb-2" />
                    <h2 className="font-bold text-neutral-900 text-base mb-1">ลืมรหัสผ่าน?</h2>
                    <p className="text-xs text-neutral-500 leading-relaxed">กรอกอีเมลที่ใช้สมัครสมาชิก แล้วเราจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้</p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">อีเมล</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        inputMode="email"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/40 focus:border-neutral-400 transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 px-4 py-3 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-600 text-sm">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-neutral-500" />
                      <span>{error}</span>
                    </div>
                  )}
                  {successMsg && (
                    <div className="flex items-start gap-2 px-4 py-3 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-700 text-sm">
                      <Check size={16} className="mt-0.5 shrink-0 text-neutral-500" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] text-white font-semibold text-sm transition-all disabled:opacity-60 shadow-sm"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        กำลังส่ง...
                      </span>
                    ) : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
                  </button>

                  <p className="text-center text-sm text-neutral-500">
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
                      className="font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
                    >
                      ← กลับไปเข้าสู่ระบบ
                    </button>
                  </p>
                </form>
              ) : (
              /* Sign In / Sign Up Form */
              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                {isSignUp && (
                  /* Upgrading / Syncing explanation card */
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 text-xs text-neutral-700 leading-relaxed flex gap-2.5">
                    <Cloud size={18} className="shrink-0 text-neutral-500 mt-0.5" />
                    <div>
                      <p className="font-bold mb-0.5">ซิงค์ข้อมูลจากเครื่องนี้ข้ามอุปกรณ์</p>
                      เมื่อสมัครสมาชิก ข้อมูลทั้งหมดที่คุณกรอกไว้ในเครื่องนี้จะถูกผูกเข้ากับอีเมลของคุณโดยอัตโนมัติ ทำให้เปิดใช้งานบนอุปกรณ์อื่น เช่น ไอโฟน ได้ทันที!
                    </div>
                  </div>
                )}

                {/* Display name (signup only) */}
                {isSignUp && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">ชื่อที่แสดง</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="เช่น สมชาย ใจดี"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required={isSignUp}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/40 focus:border-neutral-400 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">อีเมล</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      inputMode="email"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/40 focus:border-neutral-400 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">รหัสผ่าน</label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}
                        className="text-xs text-neutral-500 hover:text-neutral-700 font-medium transition-colors"
                      >
                        ลืมรหัสผ่าน?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isSignUp ? 'อย่างน้อย 6 ตัวอักษร' : '••••••••'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      minLength={6}
                      className="w-full pl-10 pr-12 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/40 focus:border-neutral-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {!isSignUp && hasLocalData && (
                  <label className="flex items-start gap-2.5 px-3 py-3 cursor-pointer select-none bg-neutral-50 border border-neutral-200/80 rounded-xl text-left">
                    <input
                      type="checkbox"
                      checked={mergeDataOnSignIn}
                      onChange={(e) => setMergeDataOnSignIn(e.target.checked)}
                      className="mt-0.5 rounded border-neutral-300 text-neutral-700 focus:ring-neutral-400/40"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-neutral-700">ดึงข้อมูลบนเครื่องนี้เข้ากับบัญชีของฉัน</span>
                      <span className="text-[10px] text-neutral-400 leading-normal">รวมรายการที่คุณบันทึกไว้ในเครื่องนี้เข้าไปยังบัญชีคลาวด์เพื่อป้องกันข้อมูลสูญหาย</span>
                    </div>
                  </label>
                )}

                {/* Error message */}
                {error && (
                  <div className="flex items-start gap-2 px-4 py-3 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-600 text-sm">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-neutral-500" />
                    <span className="whitespace-pre-line">{error}</span>
                  </div>
                )}

                {/* Success message */}
                {successMsg && (
                  <div className="flex items-start gap-2 px-4 py-3 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-700 text-sm">
                    <Check size={16} className="mt-0.5 shrink-0 text-neutral-500" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm mt-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {isSignUp ? 'กำลังบันทึก...' : 'กำลังเข้าสู่ระบบ...'}
                    </span>
                  ) : (
                    isSignUp ? 'สร้างบัญชี & ซิงค์ข้อมูล' : 'เข้าสู่ระบบ'
                  )}
                </button>

                {/* Switch mode link */}
                <p className="text-center text-sm text-neutral-500">
                  {isSignUp ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'}{' '}
                  <button
                    type="button"
                    onClick={() => { setMode(isSignUp ? 'signin' : 'signup'); setError(''); setSuccessMsg(''); }}
                    className="font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
                  >
                    {isSignUp ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
                  </button>
                </p>
              </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-400 mt-6 mb-8 pb-safe">
          ข้อมูลของคุณถูกเก็บอย่างปลอดภัยด้วย Supabase RLS 🔒
        </p>
      </div>
    </div>
  );
}
