'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: (key: string) => string;
  translateText: (text: string) => Promise<string>;
}

// Translations — extend as needed
const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Navbar
    nav_abayas: 'Abayas',
    nav_shaylas: 'Shaylas',
    nav_niqabs: 'Niqabs',
    nav_eid: 'Eid Collection',
    nav_offers: 'Offers',
    nav_search_placeholder: 'Search premium abayas...',
    nav_signin: 'Sign In',
    nav_account: 'My Account',
    nav_admin: 'Admin Panel',
    nav_logout: 'Logout',
    nav_signed_as: 'Signed in as',

    // Language names
    lang_en: 'English',
    lang_ar: 'العربية',

    // Cart
    cart_empty: 'Your cart is empty',
    cart_subtotal: 'Subtotal',
    cart_shipping: 'Shipping',
    cart_tax: 'VAT (5%)',
    cart_total: 'Grand Total',
    cart_checkout: 'Proceed to Checkout',
    cart_free_shipping: 'Free',

    // Product
    add_to_cart: 'Add to Bag',
    in_stock: 'In Stock',
    out_of_stock: 'Out of Stock',
    select_size: 'Select Size',
    select_color: 'Select Color',

    // Checkout
    checkout_title: 'Checkout',
    checkout_delivery: 'Delivery Address',
    checkout_payment: 'Payment Method',
    checkout_place_order: 'Place Secure Order',
    checkout_processing: 'Processing Order...',

    // Footer
    footer_brand_desc: 'Curating luxury abayas, modest wear, and accessories since 2026. Handcrafted with fine fabrics in Dubai.',
    footer_collections: 'Collections',
    footer_care: 'Customer Care',
    footer_contact: 'Store Contact',
    footer_rights: 'All rights reserved.',
  },
  ar: {
    // Navbar
    nav_abayas: 'عباءات',
    nav_shaylas: 'شيلان',
    nav_niqabs: 'نقاب',
    nav_eid: 'مجموعة العيد',
    nav_offers: 'عروض',
    nav_search_placeholder: 'ابحثي عن عباءاتنا الفاخرة...',
    nav_signin: 'تسجيل الدخول',
    nav_account: 'حسابي',
    nav_admin: 'لوحة الإدارة',
    nav_logout: 'تسجيل الخروج',
    nav_signed_as: 'مسجل دخول كـ',

    // Language names
    lang_en: 'English',
    lang_ar: 'العربية',

    // Cart
    cart_empty: 'سلة التسوق فارغة',
    cart_subtotal: 'المجموع الجزئي',
    cart_shipping: 'الشحن',
    cart_tax: 'ضريبة القيمة المضافة (5٪)',
    cart_total: 'الإجمالي الكلي',
    cart_checkout: 'المتابعة للدفع',
    cart_free_shipping: 'مجاني',

    // Product
    add_to_cart: 'أضف إلى الحقيبة',
    in_stock: 'متوفر',
    out_of_stock: 'غير متوفر',
    select_size: 'اختاري المقاس',
    select_color: 'اختاري اللون',

    // Checkout
    checkout_title: 'إتمام الطلب',
    checkout_delivery: 'عنوان التوصيل',
    checkout_payment: 'طريقة الدفع',
    checkout_place_order: 'تأكيد الطلب بأمان',
    checkout_processing: 'جارٍ معالجة الطلب...',

    // Footer
    footer_brand_desc: 'نقدم أجود العباءات الفاخرة والملابس المحتشمة والإكسسوارات منذ 2026. مصنوعة يدوياً بأرقى الأقمشة في دبي.',
    footer_collections: 'المجموعات',
    footer_care: 'خدمة العملاء',
    footer_contact: 'تواصل معنا',
    footer_rights: 'جميع الحقوق محفوظة.',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  isRTL: false,
  t: (key) => key,
  translateText: async (t) => t,
});

// Helper function to translate text dynamically with Google API
export async function translateWithGoogleApi(text: string, sourceLang = 'en', targetLang = 'ar'): Promise<string> {
  if (!text || !text.trim()) return '';
  const trimmed = text.trim();
  const cacheKey = `borka_trans_${sourceLang}_${targetLang}_${trimmed}`;

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  }

  // 1. Try our backend Google translate proxy
  try {
    const res = await fetch(`${API_BASE_URL}/ecommerce/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, sl: sourceLang, tl: targetLang }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.translatedText) {
        if (typeof window !== 'undefined') {
          try { localStorage.setItem(cacheKey, data.translatedText); } catch (_) {}
        }
        return data.translatedText;
      }
    }
  } catch (_) {}

  // 2. Direct fallback to Google GTX API
  try {
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sourceLang)}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(gtxUrl);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.[0])) {
        const translated = data[0].map((item: any) => item[0]).join('');
        if (typeof window !== 'undefined') {
          try { localStorage.setItem(cacheKey, translated); } catch (_) {}
        }
        return translated;
      }
    }
  } catch (err) {
    console.warn('Google Translate API error:', err);
  }

  return trimmed;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load and initialize Google Translate Element Script
  const initGoogleTranslateScript = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Define callback
    (window as any).googleTranslateElementInit = () => {
      try {
        if ((window as any).google?.translate?.TranslateElement) {
          new (window as any).google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'ar,en',
              autoDisplay: false,
            },
            'google_translate_element'
          );
        }
      } catch (err) {
        console.warn('Google translate init error', err);
      }
    };

    // Inject script if not already in document
    const existingScript = document.getElementById('google-translate-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    // Immediately remove/hide Google Translate default banners, gif backgrounds, and popups
    if (typeof window !== 'undefined' && !(window as any).__gtCleanObserver) {
      (window as any).__gtCleanObserver = true;
      const hideGoogleBranding = () => {
        const els = document.querySelectorAll(
          'iframe.goog-te-banner-frame, iframe.skiptranslate, #goog-gt-tt, .goog-te-balloon-frame, [style*="te_bk.gif"], .goog-te-gadget'
        );
        els.forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.setProperty('display', 'none', 'important');
          htmlEl.style.setProperty('visibility', 'hidden', 'important');
          htmlEl.style.setProperty('height', '0px', 'important');
          htmlEl.style.setProperty('width', '0px', 'important');
          htmlEl.style.setProperty('background-image', 'none', 'important');
        });
        if (document.body.style.top && document.body.style.top !== '0px') {
          document.body.style.top = '0px';
        }
      };

      hideGoogleBranding();
      if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(hideGoogleBranding);
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }
  }, []);

  const triggerGoogleTranslateWidget = (lang: Language) => {
    if (typeof document === 'undefined') return;

    // Set cookie for Google Translate
    const host = window.location.hostname;
    const isArabic = lang === 'ar';
    const cookieVal = isArabic ? '/en/ar' : '/en/en';

    document.cookie = `googtrans=${cookieVal}; path=/;`;
    if (host) {
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${host};`;
    }

    // Trigger select dropdown if already rendered
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (select) {
      select.value = isArabic ? 'ar' : 'en';
      select.dispatchEvent(new Event('change'));
    }
  };

  const applyLang = (lang: Language) => {
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    initGoogleTranslateScript();
    triggerGoogleTranslateWidget(lang);
  };

  useEffect(() => {
    const stored = localStorage.getItem('preferred_language') as Language | null;
    const initialLang = stored === 'ar' || stored === 'en' ? stored : 'en';
    setLanguageState(initialLang);
    applyLang(initialLang);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferred_language', lang);
    applyLang(lang);
  };

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] ?? TRANSLATIONS['en'][key] ?? key;
  };

  const translateText = async (text: string): Promise<string> => {
    if (language === 'en') return text;
    return translateWithGoogleApi(text, 'en', 'ar');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL: language === 'ar', t, translateText }}>
      {children}
      <div id="google_translate_element" className="hidden" aria-hidden="true" style={{ display: 'none' }} />
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
