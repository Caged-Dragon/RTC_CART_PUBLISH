import React from 'react';
import { BookOpen, MessageCircle, ClipboardCheck, PackageCheck } from 'lucide-react';

export type OrderFunnelMode = 'checkout' | 'submitted' | 'verified' | 'locked' | 'dispatched';

const STEPS = [
  { title: 'Product enquiry', detail: 'Browse the catalogue and optionally keep a local shortlist; no online order is submitted.', icon: BookOpen },
  { title: 'Phone / WhatsApp discussion', detail: '+91 8124100501 can discuss current stock, location, transport and lawful fulfilment options.', icon: MessageCircle },
  { title: 'Direct confirmation', detail: 'Any permitted offline transaction must be confirmed directly with the licensed business.', icon: ClipboardCheck },
  { title: 'Permitted fulfilment', detail: 'Transport, delivery and payment terms are agreed directly, subject to applicable law.', icon: PackageCheck },
];

export const OrderVerificationFunnel: React.FC<{ mode?: OrderFunnelMode; compact?: boolean }> = ({ compact = false }) => (
  <section className={`rt-order-funnel ${compact ? 'compact' : ''}`} aria-label="Product enquiry process">
    <div className="rt-order-funnel-heading"><div><span className="rt-kicker">Product enquiry process</span><h3>From catalogue to direct discussion</h3></div><span className="rt-cod-chip">Enquiry only</span></div>
    <ol className="rt-order-funnel-steps">
      {STEPS.map((step, index) => { const Icon = step.icon; return <li key={step.title}>
        <span className="rt-order-funnel-icon"><Icon aria-hidden="true" /></span>
        <div><strong><span className="rt-order-funnel-number">Step {index + 1}</span> {step.title}</strong><p>{step.detail}</p></div>
      </li>; })}
    </ol>
    <p className="rt-order-funnel-note">This website is a product catalogue and does not accept online fireworks orders or payments. Contact the sales team for lawful offline enquiries.</p>
  </section>
);
