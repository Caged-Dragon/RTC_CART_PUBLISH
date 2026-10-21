import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Github,
  Globe2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  UserRoundPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { ScreenId } from '../components/Navbar';
import type { AuthOAuthProviderName } from '../lib/supabase';
import exactCompanyLogoFallback from '../assets/logo.jpeg';

interface AuthScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

type AuthMode = 'signin' | 'register';
type NoticeType = 'success' | 'error' | 'info';

const inputClass = 'rt-auth-input w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-amber-500/30';

function friendlyAuthError(error: unknown, mode: AuthMode): string {
  const message = error instanceof Error ? error.message : '';
  const normalized = message.toLocaleLowerCase();
  if (/invalid login credentials|invalid_credentials|email or password/.test(normalized)) {
    return 'The email address or password did not match. Check your details or use Forgot password to reset it.';
  }
  if (/users_phone_key|duplicate key.*phone|phone.*already (registered|used|in use)|sqlstate 23505/.test(normalized)) {
    return 'This mobile number is already registered to another account. Use the number linked to your account, or contact support if this is your number.';
  }
  if (/redirect_uri_mismatch|redirect uri mismatch|redirect url mismatch/.test(normalized)) {
    return 'The identity provider rejected its callback URL. In the Google, Facebook or Microsoft app, set the callback to https://hhbpyxhtksgbkaigeutl.supabase.co/auth/v1/callback; separately allow your website URL in Supabase Authentication → URL Configuration.';
  }
  if (/invalid_client|invalid client|client_secret|client_id|oauth provider.*(configuration|rejected)/.test(normalized)) {
    return 'The provider rejected its OAuth configuration. Check the provider Client ID and Secret in Supabase Authentication → Sign In / Providers.';
  }
  if (/access_denied|user_cancelled|user canceled|user cancelled/.test(normalized)) {
    return 'Sign-in was cancelled or blocked by the identity provider. Try again, or use email sign-in.';
  }
  if (/email_not_provided|email not returned|email.*missing/.test(normalized)) {
    return 'The identity provider did not return an email address. Check its email permission and try again.';
  }
  if (/email not confirmed|email_not_confirmed/.test(normalized)) {
    return 'Please confirm your email using the link Supabase sent you, then sign in again.';
  }
  if (/too many requests|rate limit|over_email_send_rate_limit/.test(normalized)) {
    return 'There have been too many attempts. Wait a few minutes and try again.';
  }
  if (/user already registered|already registered|user already exists|email.*registered/.test(normalized)) {
    return 'An account may already exist for this email. Try signing in or use Forgot password.';
  }
  if (/password should be|weak password|password.*too short/.test(normalized)) {
    return 'That password does not meet the password rules configured in Supabase. Choose a longer, unique password and try again.';
  }
  if (/failed to fetch|networkerror|network request failed|load failed/.test(normalized)) {
    return 'We could not reach Supabase right now. Check your connection and try again.';
  }
  if (/provider is not enabled|unsupported provider|provider.*disabled/.test(normalized)) {
    return 'This social sign-in option is not available in Supabase right now. Choose another enabled method.';
  }
  if (/redirect.*(not allowed|invalid)|redirect_uri/.test(normalized)) {
    return 'The sign-in return URL is not allowed by Supabase. Check the Site URL and Redirect URLs in Authentication settings.';
  }
  if (message) return message;
  return mode === 'register' ? 'We could not create your account. Please check your details and try again.' : 'We could not sign you in. Please try again.';
}

function providerIcon(provider: AuthOAuthProviderName) {
  if (provider === 'github') return <Github aria-hidden="true" />;
  if (provider === 'google') return <Globe2 aria-hidden="true" />;
  if (provider === 'azure' || provider === 'workos' || provider === 'keycloak') return <ShieldCheck aria-hidden="true" />;
  return <LogIn aria-hidden="true" />;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onNavigate }) => {
  const {
    user,
    isAuthenticated,
    loading: authLoading,
    isPasswordRecovery,
    login,
    signup,
    loginWithProvider,
    resetPassword,
    updatePassword,
    logout,
    enabledOAuthProviders,
    oauthProvidersLoading,
    oauthProvidersError,
    authCallbackError,
    clearAuthCallbackError,
  } = useAuth();
  const { updateCustomerDetails } = useCart();
  const { storeInfo } = useStore();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<NoticeType>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setMessage = (type: NoticeType, message: string) => {
    setNoticeType(type);
    setNotice(message);
  };

  useEffect(() => {
    if (!authCallbackError) return;
    setMessage('error', friendlyAuthError(new Error(authCallbackError), 'signin'));
    clearAuthCallbackError();
  }, [authCallbackError, clearAuthCallbackError]);

  const changeMode = (next: AuthMode) => {
    setMode(next);
    setNotice(null);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setMessage('error', 'Enter your email address to continue.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setMessage('error', 'Enter a valid email address, such as you@example.com.');
      return;
    }

    let normalizedPhone = phone.replace(/\D/g, '').slice(-10);
    if (mode === 'register') {
      const cleanName = name.trim().replace(/\s+/g, ' ');
      if (cleanName.length < 2) {
        setMessage('error', 'Enter your full name so we can prepare your customer profile.');
        return;
      }
      if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
        setMessage('error', 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.');
        return;
      }
      if (password.length < 8) {
        setMessage('error', 'Choose a password with at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setMessage('error', 'The passwords do not match. Please check both fields.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await login('', '', cleanEmail, password);
        setMessage('success', 'You are signed in securely.');
      } else {
        const cleanName = name.trim().replace(/\s+/g, ' ');
        const signupResult = await signup(cleanName, normalizedPhone, cleanEmail, password, city.trim());
        updateCustomerDetails({ name: cleanName, phone: normalizedPhone, email: cleanEmail, ...(city.trim() ? { city: city.trim() } : {}) });
        setPassword('');
        setConfirmPassword('');
        if (signupResult === 'confirmation-required') {
          setMode('signin');
          setNoticeType('info');
          setNotice('Check your inbox (and spam folder) for a confirmation link from Supabase. Verify your email before signing in. For privacy, we show the same message whether or not the address was newly registered.');
        } else {
          setMessage('success', 'Your customer account is ready. Welcome to RedThunder!');
        }
      }
    } catch (error) {
      setMessage('error', friendlyAuthError(error, mode));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (recoveryPassword.length < 8) {
      setMessage('error', 'Use a new password with at least 8 characters.');
      return;
    }
    setIsSubmitting(true);
    setNotice(null);
    try {
      await updatePassword(recoveryPassword);
      setRecoveryPassword('');
      setShowRecoveryPassword(false);
      setMessage('success', 'Your password has been updated by Supabase Auth.');
    } catch (error) {
      setMessage('error', friendlyAuthError(error, mode));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProviderLogin = async (provider: AuthOAuthProviderName) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setNotice(null);
    try {
      await loginWithProvider(provider);
      // Supabase normally redirects the browser. Keep a fallback status in case navigation is interrupted.
      setMessage('info', `Connecting to ${enabledOAuthProviders.find((item) => item.id === provider)?.label || provider}…`);
    } catch (error) {
      setMessage('error', friendlyAuthError(error, mode));
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setMessage('error', 'Enter your email address first, then choose Forgot password.');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    setNotice(null);
    try {
      await resetPassword(cleanEmail);
      setMessage('success', 'If an account exists for that email, Supabase will send password-reset instructions. Check your inbox and spam folder.');
    } catch (error) {
      setMessage('error', friendlyAuthError(error, mode));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestCheckout = () => {
    setMessage('info', 'You can continue browsing the catalogue and keep a local shortlist without signing in. No online order is submitted.');
    onNavigate('cart');
  };

  const notices = notice ? (
    <div className={`rt-auth-alert rt-auth-alert-${noticeType}`} role={noticeType === 'error' ? 'alert' : 'status'} aria-live={noticeType === 'error' ? 'assertive' : 'polite'}>
      {noticeType === 'error' ? <AlertCircle aria-hidden="true" /> : noticeType === 'success' ? <CheckCircle2 aria-hidden="true" /> : <Mail aria-hidden="true" />}
      <span>{notice}</span>
    </div>
  ) : null;

  return (
    <section className="rt-auth-page" data-rtc-component="auth_card" aria-labelledby="auth-page-title">
      <div className="rt-auth-layout">
        <aside className="rt-auth-story" aria-label="RedThunder customer benefits">
          <img className="rt-auth-story-image" src="/images/storefront/hero-desktop.jpg" alt="" aria-hidden="true" />
          <div className="rt-auth-story-content">
            <div className="rt-auth-brand-mark">
              <img
                className="rt-auth-brand-logo"
                src={storeInfo.logoUrl || exactCompanyLogoFallback}
                alt={storeInfo.name || 'RedThunder Crackers'}
                decoding="async"
                onError={(event) => {
                  const image = event.currentTarget;
                  // Keep the authentic source image intact; fallback bytes match the Supabase Storage logo.
                  if (image.dataset.localFallback !== 'true') {
                    image.dataset.localFallback = 'true';
                    image.src = exactCompanyLogoFallback;
                  }
                }}
              />
            </div>
            <p className="rt-auth-eyebrow">REDTHUNDER CRACKERS · SIVAKASI</p>
            <h2>Celebrations start with a better way to shop.</h2>
            <p className="rt-auth-story-copy">Sign in once to keep your orders, delivery details and favourites together.</p>
            <ul className="rt-auth-benefits">
              <li><PackageCheck aria-hidden="true" /><span>Track your orders in one place</span></li>
              <li><ShoppingBag aria-hidden="true" /><span>Keep your shopping journey organised</span></li>
              <li><ShieldCheck aria-hidden="true" /><span>Passwords and sign-in are handled by Supabase Auth</span></li>
            </ul>
            <div className="rt-auth-story-footer"><BadgeCheck aria-hidden="true" /> Factory-direct catalogue · Secure account access</div>
          </div>
        </aside>

        <div className="rt-auth-panel-wrap">
          <div className="rt-auth-panel">
            <div className="rt-auth-panel-heading">
              <div className="rt-auth-heading-icon"><UserRound aria-hidden="true" /></div>
              <div>
                <p className="rt-auth-kicker">CUSTOMER ACCOUNT</p>
                <h1 id="auth-page-title">{isPasswordRecovery ? 'Set a new password' : authLoading ? 'Checking your session' : isAuthenticated ? 'Your account' : mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
                <p>{isPasswordRecovery ? 'Choose a new password to secure your account.' : authLoading ? 'We are verifying your Supabase session.' : isAuthenticated ? 'Your account is connected and ready.' : mode === 'signin' ? 'Sign in to pick up where you left off.' : 'Create one account to keep your orders and delivery details together.'}</p>
              </div>
            </div>

            {notices}

            {authLoading ? (
              <div className="rt-auth-loading" role="status"><LoaderCircle className="animate-spin" aria-hidden="true" /><span>Verifying account…</span></div>
            ) : isPasswordRecovery ? (
              <form onSubmit={handlePasswordUpdate} className="rt-auth-form">
                <label className="rt-auth-field"><span>New password</span><div className="rt-auth-input-wrap"><LockKeyhole aria-hidden="true" /><input className={inputClass} type={showRecoveryPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={recoveryPassword} onChange={(event) => setRecoveryPassword(event.target.value)} placeholder="At least 8 characters" aria-describedby="recovery-password-help" /><button type="button" className="rt-auth-eye" onClick={() => setShowRecoveryPassword((shown) => !shown)} aria-label={showRecoveryPassword ? 'Hide password' : 'Show password'}>{showRecoveryPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></div><small id="recovery-password-help">Use a unique password with at least 8 characters.</small></label>
                <button className="rt-auth-primary" type="submit" disabled={isSubmitting || recoveryPassword.length < 8} aria-busy={isSubmitting}>{isSubmitting ? <><LoaderCircle className="animate-spin" /> Updating…</> : <>Update password <ArrowRight aria-hidden="true" /></>}</button>
                <button type="button" className="rt-auth-text-button" onClick={() => { window.history.replaceState({}, document.title, '/login'); window.location.assign('/login'); }}>Return to sign in</button>
              </form>
            ) : isAuthenticated && user ? (
              <div className="rt-auth-account-view">
                <div className="rt-auth-user-summary"><div className="rt-auth-avatar">{(user.name || user.email || 'U').trim().charAt(0).toUpperCase()}</div><div><strong>{user.name || 'Customer'}</strong><span>{user.email}</span>{user.phone && <span>{user.phone}</span>}</div><BadgeCheck aria-label="Signed in" /></div>
                <button className="rt-auth-primary" onClick={() => onNavigate('myorders')}>View my orders <ArrowRight aria-hidden="true" /></button>
                <button className="rt-auth-secondary" onClick={() => onNavigate('cart')}>Open my cart <ShoppingBag aria-hidden="true" /></button>
                <button className="rt-auth-text-button rt-auth-signout" onClick={async () => { setIsSubmitting(true); try { await logout(); setMessage('success', 'You have signed out.'); } catch { setMessage('info', 'Your local session has been cleared.'); } finally { setIsSubmitting(false); } }} disabled={isSubmitting}><LogOut aria-hidden="true" /> Sign out</button>
              </div>
            ) : (
              <>
                <div className="rt-auth-mode-switch" role="tablist" aria-label="Account access type">
                  <button type="button" role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'is-active' : ''} onClick={() => changeMode('signin')}><LogIn aria-hidden="true" /> Sign in</button>
                  <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'is-active' : ''} onClick={() => changeMode('register')}><UserRoundPlus aria-hidden="true" /> Create account</button>
                </div>

                <form onSubmit={handleSubmit} className="rt-auth-form" noValidate>
                  {mode === 'register' && <label className="rt-auth-field"><span>Full name <b>*</b></span><div className="rt-auth-input-wrap"><UserRound aria-hidden="true" /><input className={inputClass} type="text" autoComplete="name" required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" /></div></label>}

                  <label className="rt-auth-field"><span>Email address <b>*</b></span><div className="rt-auth-input-wrap"><Mail aria-hidden="true" /><input className={inputClass} type="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div></label>

                  {mode === 'register' && <label className="rt-auth-field"><span>Mobile / WhatsApp number <b>*</b></span><div className="rt-auth-input-wrap"><Phone aria-hidden="true" /><input className={inputClass} type="tel" autoComplete="tel" inputMode="tel" required maxLength={18} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit mobile number" aria-describedby="phone-help" /></div><small id="phone-help">Use an Indian mobile number. You can include +91.</small></label>}

                  {mode === 'register' && <label className="rt-auth-field"><span>City / town <small>(optional)</small></span><div className="rt-auth-input-wrap"><MapPin aria-hidden="true" /><input className={inputClass} type="text" autoComplete="address-level2" maxLength={100} value={city} onChange={(event) => setCity(event.target.value)} placeholder="e.g. Chennai" /></div></label>}

                  <label className="rt-auth-field"><span>Password <b>*</b></span><div className="rt-auth-input-wrap"><LockKeyhole aria-hidden="true" /><input className={inputClass} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required minLength={mode === 'register' ? 8 : 1} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'signin' ? 'Enter your password' : 'At least 8 characters'} /><button type="button" className="rt-auth-eye" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></div>{mode === 'register' && <small>Choose a unique password with at least 8 characters.</small>}</label>

                  {mode === 'register' && <label className="rt-auth-field"><span>Confirm password <b>*</b></span><div className="rt-auth-input-wrap"><KeyRound aria-hidden="true" /><input className={inputClass} type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter the same password again" /><button type="button" className="rt-auth-eye" onClick={() => setShowConfirmPassword((shown) => !shown)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>{showConfirmPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></div>{confirmPassword && <small className={password === confirmPassword ? 'rt-auth-match-ok' : 'rt-auth-match-error'}>{password === confirmPassword ? 'Passwords match' : 'Passwords do not match yet'}</small>}</label>}

                  {mode === 'signin' && <div className="rt-auth-forgot-row"><button type="button" onClick={() => void handleForgotPassword()} disabled={isSubmitting} className="rt-auth-text-button">Forgot password?</button></div>}

                  <button className="rt-auth-primary" type="submit" disabled={isSubmitting || !email.trim() || !password || (mode === 'register' && (!name.trim() || !phone.trim() || password.length < 8 || password !== confirmPassword))} aria-busy={isSubmitting}>{isSubmitting ? <><LoaderCircle className="animate-spin" /> Please wait…</> : mode === 'signin' ? <>Sign in securely <ArrowRight aria-hidden="true" /></> : <>Create my account <ArrowRight aria-hidden="true" /></>}</button>
                </form>

                {(oauthProvidersLoading || enabledOAuthProviders.length > 0 || oauthProvidersError) && <div className="rt-auth-oauth"><div className="rt-auth-divider"><span>Or continue with</span></div>{oauthProvidersLoading ? <p className="rt-auth-muted" role="status"><LoaderCircle className="animate-spin" /> Checking available providers…</p> : enabledOAuthProviders.length ? <div className="rt-auth-provider-grid">{enabledOAuthProviders.map((provider) => <button type="button" key={provider.id} onClick={() => void handleProviderLogin(provider.id)} disabled={isSubmitting} aria-busy={isSubmitting}>{providerIcon(provider.id)}<span>Continue with {provider.label}</span></button>)}</div> : <p className="rt-auth-muted" role="status">{oauthProvidersError ? 'We could not load social sign-in options. Refresh the page or try email sign-in.' : 'No social sign-in providers are currently enabled.'}</p>}</div>}

                <div className="rt-auth-guest"><span>Just browsing?</span><button type="button" onClick={handleGuestCheckout}>Continue to catalogue <ArrowRight aria-hidden="true" /></button></div>
                <p className="rt-auth-privacy"><ShieldCheck aria-hidden="true" /> Your password is sent directly to Supabase Auth. It is never stored in your customer profile.</p>
              </>
            )}
          </div>
          <p className="rt-auth-help">Need help with your account? <button type="button" onClick={() => onNavigate('contact')}>Contact customer support</button></p>
        </div>
      </div>
    </section>
  );
};
