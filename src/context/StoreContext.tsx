import React, { createContext, useContext, useEffect, useState } from 'react';
import { dbSelect } from '../lib/supabase';
import { STORE_INFO as FALLBACK_INFO, StoreInfo } from '../data/products';

export interface MerchantRules {
  /** Minimum cart value (₹) required to place a booking. 0 = no minimum. */
  minimumOrderValue: number;
  /** When false the season booking window is closed. */
  isBookingOpen: boolean;
  dispatchPolicy: string;
}

interface StoreContextValue { storeInfo: StoreInfo; merchant: MerchantRules; loading: boolean; }

const FALLBACK_RULES: MerchantRules = {
  minimumOrderValue: 0,
  isBookingOpen: true,
  dispatchPolicy: 'Against payment receipt only, crackers dispatched from Sivakasi',
};

const StoreContext = createContext<StoreContextValue>({ storeInfo: FALLBACK_INFO, merchant: FALLBACK_RULES, loading: true });

const digitsOnly = (v: string) => v.replace(/\D/g, '');
/** wa.me needs country code + number, no "+" or spaces. Indian 10-digit numbers get 91 prefixed. */
const toWaNumber = (v: string) => { const d = digitsOnly(v); return d.length === 10 ? `91${d}` : d; };

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(FALLBACK_INFO);
  const [merchant, setMerchant] = useState<MerchantRules>(FALLBACK_RULES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const company = dbSelect<any>(
      'company_profile',
      'select=company_name,tagline,physical_address,city,state,postal_code,country,mobile,whatsapp_number,logo_url&is_active=eq.true&limit=1'
    ).then(rows => {
      const r = rows[0];
      if (!r || !active) return;
      const wa = r.whatsapp_number || r.mobile;
      setStoreInfo({
        ...FALLBACK_INFO,
        name: r.company_name || FALLBACK_INFO.name,
        tagline: r.tagline || FALLBACK_INFO.tagline,
        phone: wa ? toWaNumber(wa) : FALLBACK_INFO.phone,
        phoneDisplay: wa ? `+91 ${digitsOnly(wa).slice(-10)}` : FALLBACK_INFO.phoneDisplay,
        address: r.physical_address || FALLBACK_INFO.address,
        city: r.city || FALLBACK_INFO.city,
        state: r.state || FALLBACK_INFO.state,
        pincode: r.postal_code || FALLBACK_INFO.pincode,
        logoUrl: r.logo_url || FALLBACK_INFO.logoUrl,
      });
    }).catch(() => {});

    const rules = dbSelect<any>(
      'merchant_settings',
      'select=minimum_order_value,is_season_booking_open,dispatch_policy_text,whatsapp_booking_number&limit=1'
    ).then(rows => {
      const r = rows[0];
      if (!r || !active) return;
      setMerchant({
        minimumOrderValue: Number(r.minimum_order_value || 0),
        isBookingOpen: r.is_season_booking_open !== false,
        dispatchPolicy: r.dispatch_policy_text || FALLBACK_RULES.dispatchPolicy,
      });
      // Booking desk number (if set) takes precedence for WhatsApp orders.
      if (r.whatsapp_booking_number) {
        setStoreInfo(prev => ({ ...prev, phone: toWaNumber(r.whatsapp_booking_number), phoneDisplay: `+91 ${digitsOnly(r.whatsapp_booking_number).slice(-10)}` }));
      }
    }).catch(() => {});

    Promise.allSettled([company, rules]).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <StoreContext.Provider value={{ storeInfo, merchant, loading }}>{children}</StoreContext.Provider>;
};
export const useStore = () => useContext(StoreContext);
