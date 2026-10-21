import React, { createContext, useContext, useEffect, useState } from 'react';
import { dbSelect } from '../lib/supabase';
import { STORE_INFO as FALLBACK_INFO, StoreInfo } from '../data/products';

export interface MerchantRules { minimumOrderValue: number; isBookingOpen: boolean; dispatchPolicy: string; }
interface StoreContextValue { storeInfo: StoreInfo; merchant: MerchantRules; loading: boolean; }
const FALLBACK_RULES: MerchantRules = {
  minimumOrderValue: 3000, isBookingOpen: false,
  dispatchPolicy: 'Catalogue and enquiry only. This website does not accept online fireworks orders or payments. For permitted offline fulfilment, clarify availability, transport and payment terms directly with the licensed business.',
};
const StoreContext = createContext<StoreContextValue>({ storeInfo: FALLBACK_INFO, merchant: FALLBACK_RULES, loading: true });

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(FALLBACK_INFO);
  const [merchant, setMerchant] = useState<MerchantRules>(FALLBACK_RULES);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [siteRows, mediaRows, settingsRows] = await Promise.all([
          dbSelect<any>('app_sites', 'select=site_name,domain,config&domain=eq.cart.rtcrackers.com&is_active=eq.true&limit=1'),
          dbSelect<any>('web_media', 'select=media_url,media_name,alt_text&media_id=eq.1&is_public=eq.true&is_active=eq.true&limit=1').catch(() => []),
          dbSelect<any>('web_settings', 'select=setting_key,setting_value&is_public=eq.true').catch(() => []),
        ]);
        if (!active) return;
        const media = mediaRows[0];
        setStoreInfo({ ...FALLBACK_INFO, name: 'REDTHUNDER CRACKERS', phone: '918124100501', phoneDisplay: '+91 8124100501', logoUrl: media?.media_url || FALLBACK_INFO.logoUrl });
        const settingMap = Object.fromEntries(settingsRows.map((row: any) => [String(row.setting_key), row.setting_value]));
        const paymentNotice = String(settingMap.portfolio_payment_notice || FALLBACK_RULES.dispatchPolicy);
        setMerchant({ minimumOrderValue: 3000, isBookingOpen: false, dispatchPolicy: paymentNotice });
        if (!siteRows.length) console.warn('The CART domain is not registered as an active app_sites record in Supabase.');
      } catch (error) {
        console.error('Could not load shared store settings; safe defaults remain active.', error);
      } finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, []);
  return <StoreContext.Provider value={{ storeInfo, merchant, loading }}>{children}</StoreContext.Provider>;
};
export const useStore = () => useContext(StoreContext);
