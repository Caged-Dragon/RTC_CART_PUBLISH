import React, { useEffect, useMemo, useState } from 'react';
import { User, LogIn, LogOut, Phone, Mail, MapPin, CheckCircle2, ShieldCheck, Settings, Trash2, Package, Save, RefreshCw, Bell, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ScreenId } from '../components/Navbar';

interface AuthScreenProps { onNavigate: (screen: ScreenId) => void; }
type Notice = { kind: 'success' | 'error' | 'info'; message: string } | null;
const fieldClass = 'w-full px-3 py-2.5 rounded-xl bg-stone-950 dark:bg-stone-950 light:bg-stone-50 border border-stone-700 dark:border-stone-700 light:border-stone-300 text-white dark:text-white light:text-stone-900 placeholder-stone-500 focus:outline-none focus:border-amber-500';
const labelClass = 'block text-stone-300 dark:text-stone-300 light:text-stone-700 font-bold mb-1';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onNavigate }) => {
  const { user, authUser, session, isAuthenticated, loading, login, signup, sendEmailOtp, verifyEmailOtp, loginWithProvider, resetPassword, logout, updateProfile, updatePreferences, deleteAccount } = useAuth();
  const { updateCustomerDetails } = useCart();
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [notice, setNotice] = useState<Notice>(null);
  const [editing, setEditing] = useState(false);
  const [deletePrompt, setDeletePrompt] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [preferences, setPreferences] = useState({ orderUpdates: true, securityEmails: true, offers: false });

  useEffect(() => {
    if (!user) return;
    setName(user.name || ''); setPhone(user.phone || ''); setEmail(user.email || authUser?.email || '');
    setCity(user.city || ''); setDistrict(user.district || ''); setState(user.state || 'Tamil Nadu'); setAddress(user.address || ''); setPincode(user.pincode || '');
    const saved = authUser?.user_metadata?.preferences;
    if (saved) setPreferences({ orderUpdates: saved.orderUpdates !== false, securityEmails: saved.securityEmails !== false, offers: saved.offers === true });
  }, [user?.authUserId, authUser?.id]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => setResendSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds > 0]);

  const handleOtpError = (error: unknown, fallback: string) => {
    const message = error instanceof Error ? error.message : fallback;
    const secondsMatch = message.match(/after\s+(\d+)\s+seconds?/i);
    const rateLimited = /http 429|rate.?limit|too many requests|only request this after/i.test(message);
    if (rateLimited) setResendSeconds(Math.max(5, Number(secondsMatch?.[1] || 60)));
    setNotice({ kind: 'error', message: rateLimited
      ? `Too many code requests. Please wait ${Math.max(5, Number(secondsMatch?.[1] || 60))} seconds before trying again. Do not keep tapping Send code.`
      : message || fallback });
  };

  const initials = useMemo(() => (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase(), [user?.name, user?.email]);
  const setError = (error: unknown, fallback: string) => setNotice({ kind: 'error', message: error instanceof Error ? error.message : fallback });

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setNotice(null);
    try {
      if (mode === 'register') {
        if (!name.trim()) throw new Error('Enter your full name.');
        if (!phone.trim()) throw new Error('Enter your mobile number.');
        await signup(name, phone, email);
      } else {
        await login('', '', email);
      }
      setStep('otp'); setOtp(''); setResendSeconds(60);
      setNotice({ kind: 'success', message: `A verification code has been sent to ${email.trim()}. You can request another code in 60 seconds.` });
    } catch (error) { handleOtpError(error, 'Unable to send a verification code.'); }
    finally { setBusy(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) { setNotice({ kind: 'error', message: 'Enter the six-digit code from your email.' }); return; }
    setBusy(true); setNotice(null);
    try {
      await verifyEmailOtp(email, otp, mode === 'register');
      if (mode === 'register') updateCustomerDetails({ name, phone, email, city: city || 'Chennai' });
      setNotice({ kind: 'success', message: 'Email verified. You are now signed in.' }); setStep('details');
    } catch (error) { setError(error, 'That code could not be verified.'); }
    finally { setBusy(false); }
  };

  const handleResendOtp = async () => {
    if (busy || resendSeconds > 0) return;
    setBusy(true); setNotice(null);
    try {
      await sendEmailOtp(email, mode === 'register', mode === 'register' ? { full_name: name.trim(), phone: phone.trim() } : {});
      setNotice({ kind: 'success', message: 'A new verification code has been sent. You can request another in 60 seconds.' }); setOtp(''); setResendSeconds(60);
    } catch (error) { handleOtpError(error, 'Unable to resend the code.'); }
    finally { setBusy(false); }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { setNotice({ kind: 'error', message: 'Enter your email address first.' }); return; }
    setBusy(true); setNotice(null);
    try { await resetPassword(email); setNotice({ kind: 'success', message: 'If the account exists, password recovery instructions have been sent.' }); }
    catch (error) { setError(error, 'Unable to send password recovery instructions.'); }
    finally { setBusy(false); }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setNotice(null);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim(), city: city.trim(), district: district.trim(), state: state.trim(), address: address.trim(), pincode: pincode.trim() });
      updateCustomerDetails({ name, phone, email, city: city || 'Chennai' });
      setEditing(false); setNotice({ kind: 'success', message: 'Your profile details have been saved.' });
    } catch (error) { setError(error, 'Unable to save your profile.'); }
    finally { setBusy(false); }
  };

  const handleSavePreferences = async () => {
    setBusy(true); setNotice(null);
    try { await updatePreferences(preferences); setNotice({ kind: 'success', message: 'Your account preferences have been saved to your account.' }); }
    catch (error) { setError(error, 'Unable to save preferences.'); }
    finally { setBusy(false); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') { setNotice({ kind: 'error', message: 'Type DELETE exactly to confirm account deletion.' }); return; }
    setBusy(true); setNotice(null);
    try { await deleteAccount(); setDeletePrompt(false); setNotice({ kind: 'success', message: 'Your account deletion request was completed.' }); }
    catch (error) { setError(error, 'Account deletion failed. Your account has not been confirmed as deleted.'); }
    finally { setBusy(false); }
  };

  const handleGuestLogin = () => { setNotice({ kind: 'info', message: 'Guest checkout is ready. You can continue without creating an account.' }); onNavigate('cart'); };

  return (
    <div data-rtc-component="auth_card" className="py-10 sm:py-12 max-w-3xl mx-auto px-4 sm:px-6 space-y-7">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-wider"><ShieldCheck className="w-3.5 h-3.5" /> Secure Customer Account</div>
        <h1 className="font-display text-3xl font-black text-white dark:text-white light:text-stone-900 tracking-tight">{isAuthenticated ? 'My Account' : mode === 'signin' ? 'Sign In with Email OTP' : 'Create Your Account'}</h1>
        <p className="text-sm text-stone-400 dark:text-stone-400 light:text-stone-600 max-w-lg mx-auto">{isAuthenticated ? 'Manage your personal details, delivery address, preferences and account security.' : 'Use a one-time code sent to your email. No password needed for sign-in.'}</p>
      </div>

      {notice && <div role="status" aria-live="polite" className={`p-3.5 rounded-xl border text-sm flex items-start gap-2 ${notice.kind === 'error' ? 'bg-red-950/40 border-red-800/60 text-red-300' : notice.kind === 'success' ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-sky-950/40 border-sky-800/60 text-sky-300'}`}><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /><span>{notice.message}</span></div>}

      {loading ? <div className="rounded-2xl border border-stone-800 p-8 text-center text-stone-400">Checking your session…</div> : isAuthenticated && user ? (
        <div className="space-y-5">
          <section className="bg-stone-900/90 dark:bg-stone-900/90 light:bg-white rounded-2xl border border-stone-800 dark:border-stone-800 light:border-stone-200 p-5 sm:p-7 shadow-xl">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-display font-black text-2xl">{initials}</div>
              <div className="flex-1 min-w-0"><h2 className="text-lg font-bold text-white dark:text-white light:text-stone-900 truncate">{user.name || 'Customer'}</h2><p className="text-sm text-stone-400 truncate">{user.email || authUser?.email}</p><p className="text-xs text-emerald-400 mt-1">Email account verified / signed in</p></div>
              <button onClick={() => onNavigate('myorders')} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 text-sm font-bold"><Package className="w-4 h-4" /> My Orders</button>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-stone-800 pb-4 mb-5"><div className="flex items-center gap-2"><User className="w-5 h-5 text-amber-400"/><h3 className="font-bold text-white dark:text-white light:text-stone-900">Personal & Delivery Details</h3></div><button onClick={() => setEditing(v => !v)} className="text-sm text-amber-400 hover:text-amber-300 underline">{editing ? 'Cancel edit' : 'Edit profile'}</button></div>
            {editing ? <form onSubmit={handleSaveProfile} className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><label className={labelClass}>Full name</label><input required value={name} onChange={e => setName(e.target.value)} className={fieldClass} autoComplete="name" /></div>
              <div><label className={labelClass}>Mobile / WhatsApp</label><input value={phone} onChange={e => setPhone(e.target.value)} className={fieldClass} autoComplete="tel" /></div>
              <div className="sm:col-span-2"><label className={labelClass}>Email (verified sign-in email)</label><input value={user.email || authUser?.email || ''} readOnly className={`${fieldClass} opacity-70`} /><p className="text-xs text-stone-500 mt-1">Email changes require a separate verified email-change flow.</p></div>
              <div className="sm:col-span-2"><label className={labelClass}>Delivery address</label><textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} className={fieldClass} autoComplete="street-address" /></div>
              <div><label className={labelClass}>City / Town</label><input value={city} onChange={e => setCity(e.target.value)} className={fieldClass} autoComplete="address-level2" /></div>
              <div><label className={labelClass}>District</label><input value={district} onChange={e => setDistrict(e.target.value)} className={fieldClass} /></div>
              <div><label className={labelClass}>State</label><input value={state} onChange={e => setState(e.target.value)} className={fieldClass} autoComplete="address-level1" /></div>
              <div><label className={labelClass}>PIN code</label><input value={pincode} onChange={e => setPincode(e.target.value)} className={fieldClass} inputMode="numeric" autoComplete="postal-code" /></div>
              <div className="sm:col-span-2"><button disabled={busy} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-5 py-3 font-bold"><Save className="w-4 h-4" />{busy ? 'Saving…' : 'Save profile'}</button></div>
            </form> : <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {[['Mobile', user.phone || 'Not added'], ['Delivery address', user.address || 'Not added'], ['City', user.city || 'Not added'], ['District', user.district || 'Not added'], ['State', user.state || 'Not added'], ['PIN code', user.pincode || 'Not added']].map(([label, value]) => <div key={label} className="rounded-xl bg-stone-950/70 dark:bg-stone-950/70 light:bg-stone-50 p-3 border border-stone-800/70 dark:border-stone-800/70 light:border-stone-200"><p className="text-xs text-stone-500 mb-1">{label}</p><p className="text-stone-200 dark:text-stone-200 light:text-stone-800 break-words">{value}</p></div>)}
            </div>}
          </section>

          <section className="bg-stone-900/90 dark:bg-stone-900/90 light:bg-white rounded-2xl border border-stone-800 dark:border-stone-800 light:border-stone-200 p-5 sm:p-7 space-y-4">
            <div className="flex items-center gap-2"><Settings className="w-5 h-5 text-amber-400"/><h3 className="font-bold text-white dark:text-white light:text-stone-900">Account Preferences</h3></div>
            <p className="text-sm text-stone-400">Choose which account-related emails you would like to receive. Preferences are saved to your authenticated Supabase account.</p>
            {[['orderUpdates','Order updates','Order confirmations and delivery status changes',Package],['securityEmails','Security emails','Sign-in and important account security notices',KeyRound],['offers','Offers and promotions','Occasional offers and product announcements',Bell]].map(([key, title, desc, Icon]) => <label key={String(key)} className="flex items-start gap-3 rounded-xl border border-stone-800 p-3 cursor-pointer"><input type="checkbox" className="mt-1 accent-amber-500" checked={preferences[key as keyof typeof preferences]} onChange={e => setPreferences(prev => ({...prev, [key as keyof typeof prev]: e.target.checked}))} /><span className="flex-1"><span className="block text-sm font-semibold text-stone-200 dark:text-stone-200 light:text-stone-800">{String(title)}</span><span className="block text-xs text-stone-500 mt-1">{String(desc)}</span></span></label>)}
            <button onClick={handleSavePreferences} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-amber-600/60 hover:bg-amber-600/10 disabled:opacity-50 text-amber-400 px-4 py-2.5 text-sm font-bold"><Save className="w-4 h-4" />Save preferences</button>
          </section>

          <section className="bg-stone-900/90 dark:bg-stone-900/90 light:bg-white rounded-2xl border border-stone-800 dark:border-stone-800 light:border-stone-200 p-5 sm:p-7 space-y-4">
            <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-amber-400"/><h3 className="font-bold text-white dark:text-white light:text-stone-900">Security & Account</h3></div>
            <div className="flex flex-wrap gap-3"><button onClick={async () => { try { await resetPassword(user.email); setNotice({kind:'success', message:'If password recovery is enabled for this account, instructions will be sent by email.'}); } catch (error) { setError(error, 'Unable to request password recovery.'); } }} className="rounded-xl border border-stone-700 hover:border-amber-500 px-4 py-2.5 text-sm text-stone-200 dark:text-stone-200 light:text-stone-800">Request password recovery</button><button onClick={() => { logout(); setNotice({kind:'success', message:'You have been signed out.'}); }} className="inline-flex items-center gap-2 rounded-xl bg-stone-800 hover:bg-stone-700 px-4 py-2.5 text-sm text-white"><LogOut className="w-4 h-4"/>Sign out</button></div>
            <div className="pt-4 border-t border-red-900/50"><div className="flex items-start gap-3"><Trash2 className="w-5 h-5 text-red-400 mt-0.5"/><div className="flex-1"><h4 className="font-bold text-red-300">Delete account</h4><p className="text-xs text-stone-500 mt-1">This is permanent. Your Supabase account will be deleted only after the secure server function confirms the request. Business/order records may require retention.</p></div></div>
              {!deletePrompt ? <button onClick={() => setDeletePrompt(true)} className="mt-3 rounded-xl border border-red-800 text-red-300 hover:bg-red-950/50 px-4 py-2.5 text-sm font-bold">Delete my account…</button> : <div className="mt-4 rounded-xl border border-red-800/70 bg-red-950/20 p-4 space-y-3"><p className="text-sm text-red-200">Type <strong>DELETE</strong> to confirm. This cannot be undone.</p><input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} className={fieldClass} placeholder="Type DELETE" autoComplete="off"/><div className="flex gap-2"><button disabled={busy || deleteConfirm !== 'DELETE'} onClick={handleDeleteAccount} className="rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-40 px-4 py-2 text-sm font-bold text-white">{busy ? 'Deleting…' : 'Confirm deletion'}</button><button onClick={() => {setDeletePrompt(false);setDeleteConfirm('');}} className="rounded-lg border border-stone-700 px-4 py-2 text-sm text-stone-300">Cancel</button></div></div>}
            </div>
          </section>
        </div>
      ) : (
        <div className="bg-stone-900/90 dark:bg-stone-900/90 light:bg-white rounded-2xl border border-stone-800 dark:border-stone-800 light:border-stone-200 p-5 sm:p-8 shadow-2xl space-y-6">
          <div className="flex p-1 bg-stone-950 dark:bg-stone-950 light:bg-stone-100 rounded-xl border border-stone-800 dark:border-stone-800 light:border-stone-200"><button type="button" onClick={() => {setMode('signin');setStep('details');setNotice(null);}} className={`flex-1 py-2.5 text-sm font-bold rounded-lg ${mode === 'signin' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-white'}`}>Sign In</button><button type="button" onClick={() => {setMode('register');setStep('details');setNotice(null);}} className={`flex-1 py-2.5 text-sm font-bold rounded-lg ${mode === 'register' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-white'}`}>Create Account</button></div>
          {step === 'details' ? <form onSubmit={handleSendOtp} className="space-y-4 text-sm">
            {mode === 'register' && <><div><label className={labelClass}>Full name *</label><input required value={name} onChange={e => setName(e.target.value)} className={fieldClass} placeholder="e.g. Anand Kumar" autoComplete="name" /></div><div><label className={labelClass}>Mobile / WhatsApp number *</label><div className="relative"><Phone className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2"/><input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={`${fieldClass} pl-10`} placeholder="e.g. 9876543210" autoComplete="tel" /></div></div><div><label className={labelClass}>City / Town</label><div className="relative"><MapPin className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2"/><input value={city} onChange={e => setCity(e.target.value)} className={`${fieldClass} pl-10`} placeholder="e.g. Chennai" autoComplete="address-level2" /></div></div></>}
            <div><label className={labelClass}>Email address *</label><div className="relative"><Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2"/><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={`${fieldClass} pl-10`} placeholder="you@example.com" autoComplete="email" /></div></div>
            <button disabled={busy} type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold uppercase tracking-wider shadow-lg transition-all">{busy ? 'Sending code…' : mode === 'signin' ? 'Send sign-in OTP' : 'Send registration OTP'}</button>
            {mode === 'signin' && <button type="button" disabled={busy} onClick={handleForgotPassword} className="text-xs text-amber-400 hover:text-amber-300 underline">Prefer a password recovery email?</button>}
          </form> : <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center"><div className="mx-auto mb-3 w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center"><Mail className="w-6 h-6"/></div><h2 className="text-lg font-bold text-white dark:text-white light:text-stone-900">Check your email</h2><p className="text-sm text-stone-400 mt-1">Enter the six-digit code sent to <strong className="text-stone-200 dark:text-stone-200 light:text-stone-800">{email}</strong></p></div>
            <div><label className={labelClass}>Email verification code</label><input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className={`${fieldClass} text-center tracking-[0.5em] text-2xl font-bold`} placeholder="000000" aria-label="Six digit email verification code" /></div>
            <button disabled={busy || otp.length !== 6} type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold">{busy ? 'Verifying…' : 'Verify code & continue'}</button>
            <div className="flex flex-wrap justify-center gap-4 text-sm"><button type="button" disabled={busy || resendSeconds > 0} onClick={handleResendOtp} className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 underline disabled:opacity-50 disabled:cursor-not-allowed"><RefreshCw className="w-3.5 h-3.5"/>{resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code'}</button><button type="button" disabled={busy} onClick={() => {setStep('details');setOtp('');setNotice(null);}} className="text-stone-400 hover:text-white underline">Change email</button></div>
          </form>}
          {step === 'details' && <><div className="pt-4 border-t border-stone-800"><p className="text-xs text-stone-500 text-center mb-3">Or continue with a connected provider</p><div className="grid grid-cols-3 gap-2"><button type="button" onClick={() => loginWithProvider('google')} className="py-2.5 rounded-lg border border-stone-700 text-xs text-stone-200 hover:border-amber-500">Google</button><button type="button" onClick={() => loginWithProvider('apple')} className="py-2.5 rounded-lg border border-stone-700 text-xs text-stone-200 hover:border-amber-500">Apple</button><button type="button" onClick={() => loginWithProvider('azure')} className="py-2.5 rounded-lg border border-stone-700 text-xs text-stone-200 hover:border-amber-500">Microsoft</button></div></div><div className="text-center"><button type="button" onClick={handleGuestLogin} className="text-amber-500 hover:text-amber-400 font-semibold text-xs underline">Continue as guest</button></div></>}
        </div>
      )}
    </div>
  );
};
