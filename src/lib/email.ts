import { SupabaseSession } from './supabase';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://ypmiinmkyvzdpakbkers.supabase.co').replace(/\/$/, '');
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/transactional-email`;

export type TransactionalEmailPayload =
  | { action: 'order_confirmation'; orderId: string; toEmail: string; guestTrackingToken?: string }
  | { action: 'order_status'; orderId: string; toEmail: string; status: string; guestTrackingToken?: string }
  | { action: 'quotation'; toEmail: string; customerName?: string; subject?: string; message?: string };

export async function sendTransactionalEmail(payload: TransactionalEmailPayload, session?: SupabaseSession | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  const response = await fetch(FUNCTION_URL, { method: 'POST', headers, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `Email service failed (${response.status})`);
  return data;
}
