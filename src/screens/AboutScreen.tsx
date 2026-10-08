import React from 'react';
import { ArrowRight, BadgeCheck, Factory, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import type { ScreenId } from '../components/Navbar';
import { useStore } from '../context/StoreContext';

export const AboutScreen: React.FC<{ onNavigate: (screen: ScreenId) => void }> = ({ onNavigate }) => {
  const { storeInfo } = useStore();
  return (
    <section className="rt-info-page" data-rtc-component="about_page">
      <div className="rt-container">
        <div className="rt-info-hero">
          <div>
            <span className="rt-kicker">About RedThunder</span>
            <h1>Factory-direct celebrations from Sivakasi.</h1>
            <p>RedThunder Crackers brings a live, easy-to-order catalogue closer to families, retailers and celebration planners — with factory pricing and human WhatsApp support.</p>
            <div className="rt-hero-actions">
              <button className="rt-btn rt-btn-primary" onClick={() => onNavigate('products')}>Explore Products <ArrowRight /></button>
              <button className="rt-btn rt-btn-outline" onClick={() => onNavigate('contact')}>Talk to the Team</button>
            </div>
          </div>
          <div className="rt-info-hero-card">
            <Factory size={32} />
            <strong>{storeInfo.city}</strong>
            <span>{storeInfo.state}</span>
            <small>Direct-source festive catalogue</small>
          </div>
        </div>

        <div className="rt-info-grid">
          {[
            [Factory, 'Factory direct', 'Live catalogue rates are read from the shared products database.'],
            [BadgeCheck, 'Quality focused', 'Product and stock information stays tied to the existing catalogue.'],
            [HeartHandshake, 'Human support', 'WhatsApp and phone support stay one tap away during ordering.'],
            [ShieldCheck, 'Safe ordering', 'Safety guidance, dispatch notes and customer support remain part of the storefront.'],
          ].map(([Icon, title, text]) => {
            const C = Icon as typeof Factory;
            return <article key={title as string} className="rt-info-card"><C /><h2>{title as string}</h2><p>{text as string}</p></article>;
          })}
        </div>

        <div className="rt-info-story">
          <div>
            <span className="rt-kicker">Built for festive shopping</span>
            <h2>Everything important stays connected to your existing store.</h2>
          </div>
          <p>The redesigned frontend changes the presentation, navigation and responsive experience. Your live product catalogue, categories, merchant rules, authentication, cart calculations and order booking continue to come from the existing integrations.</p>
        </div>

        <div className="rt-info-values">
          <article><Sparkles /><strong>Celebrate More</strong><span>Curated shopping journeys for every budget.</span></article>
          <article><BadgeCheck /><strong>Spend Less</strong><span>Factory-direct value surfaced clearly on every card.</span></article>
          <article><HeartHandshake /><strong>Order Easily</strong><span>Online browsing with WhatsApp support when you need it.</span></article>
        </div>
      </div>
    </section>
  );
};
