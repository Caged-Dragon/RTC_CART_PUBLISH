import React from 'react';
import { Mail, MessageCircle, Phone, ShieldAlert } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const WhatsAppMessagingScreen: React.FC = () => {
  const { storeInfo } = useStore();
  return <div data-rtc-component="contact_card" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
    <div className="border-b border-stone-800 dark:border-stone-800 light:border-stone-200 pb-6">
      <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1"><MessageCircle className="w-4 h-4"/><span>Official customer support</span></div>
      <h1 className="font-display text-3xl font-black text-white dark:text-white light:text-stone-900 tracking-tight">WhatsApp & Sales Enquiries</h1>
      <p className="text-sm text-stone-400 dark:text-stone-400 light:text-stone-600 mt-2 max-w-2xl">Contact RedThunder Crackers for general catalogue, product and business information. No order or payment is submitted from this page, and no cart or personal information is sent in the link.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <a className="rounded-2xl border border-stone-700 bg-stone-900/80 p-6 min-h-44 flex flex-col gap-3 hover:border-emerald-500" href="https://wa.me/918124100501" target="_blank" rel="noopener noreferrer"><MessageCircle className="w-7 h-7 text-emerald-400"/><strong className="text-lg text-white">Open WhatsApp</strong><span className="text-stone-300">{storeInfo.phoneDisplay || '+91 8124100501'}</span><small className="text-stone-400">General support chat</small></a>
      <a className="rounded-2xl border border-stone-700 bg-stone-900/80 p-6 min-h-44 flex flex-col gap-3 hover:border-amber-500" href="tel:+918124100501"><Phone className="w-7 h-7 text-amber-400"/><strong className="text-lg text-white">Call sales</strong><span className="text-stone-300">+91 8124100501</span><small className="text-stone-400">Primary support</small></a>
      <a className="rounded-2xl border border-stone-700 bg-stone-900/80 p-6 min-h-44 flex flex-col gap-3 hover:border-amber-500" href="mailto:sales@rtcrackers.com"><Mail className="w-7 h-7 text-amber-400"/><strong className="text-lg text-white">Email sales</strong><span className="text-stone-300">sales@rtcrackers.com</span><small className="text-stone-400">Written product enquiries</small></a>
    </div>
    <div className="rounded-2xl border border-amber-700/50 bg-amber-950/20 p-5 flex gap-3"><ShieldAlert className="w-6 h-6 text-amber-400 shrink-0"/><div><strong className="text-white">Catalogue and enquiry only</strong><p className="text-sm text-stone-300 mt-1">This website does not accept online fireworks orders or payments. Discuss any permitted offline fulfilment, transport and payment terms directly with the licensed business. Secondary support: +91 7358737658 · support@rtcrackers.com.</p></div></div>
  </div>;
};
