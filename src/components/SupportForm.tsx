import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { rpc } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/** Saves the message, e-mails the customer an automatic acknowledgement and alerts the support inbox. */
export const SupportForm: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', website: '' });
  const [state, setState] = useState<{ kind: 'idle' | 'sending' | 'done' | 'error'; text?: string }>({ kind: 'idle' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.website) return; // hidden field: only bots fill it in
    setState({ kind: 'sending' });
    try {
      const r = await rpc<{ reference: string }>('submit_support_request', {
        p_name: form.name || (user as any)?.name || '', p_email: form.email || (user as any)?.email || '', p_phone: form.phone || null,
        p_subject: form.subject, p_message: form.message, p_order_number: null,
      });
      setState({ kind: 'done', text: `Thank you! We have received your message (reference ${r.reference}) and sent a confirmation to your email.` });
      setForm({ name: '', email: '', phone: '', subject: '', message: '', website: '' });
    } catch (err: any) {
      setState({ kind: 'error', text: String(err?.message || 'Could not send your message. Please try again or call us.').replace(/^.*?:\s*/, '') });
    }
  };

  return (
    <form className="rt-support-form" onSubmit={submit} aria-label="Contact support">
      <h2>Send us a message</h2>
      <label>Your name<input required maxLength={80} value={form.name} onChange={set('name')} autoComplete="name" /></label>
      <label>Email<input required type="email" maxLength={200} value={form.email} onChange={set('email')} autoComplete="email" /></label>
      <label>Mobile (optional)<input inputMode="numeric" maxLength={14} value={form.phone} onChange={set('phone')} autoComplete="tel" /></label>
      <label>Subject<input required minLength={3} maxLength={150} value={form.subject} onChange={set('subject')} /></label>
      <label className="wide">How can we help?<textarea required minLength={10} maxLength={4000} rows={5} value={form.message} onChange={set('message')} /></label>
      <input className="rt-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set('website')} />
      <button className="rt-btn rt-btn-primary" disabled={state.kind === 'sending'}><Send /> {state.kind === 'sending' ? 'Sending…' : 'Send message'}</button>
      {state.text && <p className={`rt-support-msg ${state.kind}`} role="status">{state.text}</p>}
    </form>
  );
};
