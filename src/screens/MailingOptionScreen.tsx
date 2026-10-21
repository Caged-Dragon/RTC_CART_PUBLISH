import React from 'react';
import { Mail, Phone, MessageCircle, ShieldAlert } from 'lucide-react';

interface MailingOptionScreenProps { onOpenInvoice?: () => void; }

export const MailingOptionScreen: React.FC<MailingOptionScreenProps> = () => (
  <div data-rtc-component="contact_sales" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
    <div className="border-b border-stone-800 dark:border-stone-800 light:border-stone-200 pb-6">
      <div className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-widest mb-1"><Mail className="w-4 h-4" /><span>Sales and support</span></div>
      <h1 className="font-display text-3xl font-black text-white dark:text-white light:text-stone-900 tracking-tight">Contact RedThunder Sales</h1>
      <p className="text-sm text-stone-400 dark:text-stone-400 light:text-stone-600 mt-2 max-w-2xl">This site provides catalogue information only. It does not submit online fireworks orders, quotations, addresses or payments. Contact the business directly with general product questions.</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <a className="rounded-2xl border border-stone-700 p-6 min-h-40 flex flex-col gap-3 hover:border-amber-500" href="tel:+918124100501"><Phone className="w-6 h-6 text-amber-400"/><strong className="text-lg">Call primary support</strong><span>+91 8124100501</span></a>
      <a className="rounded-2xl border border-stone-700 p-6 min-h-40 flex flex-col gap-3 hover:border-amber-500" href="https://wa.me/918124100501" target="_blank" rel="noopener noreferrer"><MessageCircle className="w-6 h-6 text-emerald-400"/><strong className="text-lg">WhatsApp support</strong><span>+91 8124100501</span></a>
      <a className="rounded-2xl border border-stone-700 p-6 min-h-40 flex flex-col gap-3 hover:border-amber-500" href="mailto:sales@rtcrackers.com"><Mail className="w-6 h-6 text-amber-400"/><strong className="text-lg">Email sales</strong><span>sales@rtcrackers.com</span></a>
    </div>
    <div className="rounded-2xl border border-amber-700/50 bg-amber-950/20 p-5 flex gap-3"><ShieldAlert className="w-6 h-6 text-amber-400 shrink-0"/><div><strong className="text-white">Enquiry only</strong><p className="text-sm text-stone-300 mt-1">Please do not send payment details here. Confirm any lawful offline purchase, stock, transport and fulfilment terms directly with the licensed business.</p><p className="text-sm text-stone-400 mt-2">Secondary support: +91 7358737658 · support@rtcrackers.com</p></div></div>
  </div>
);
