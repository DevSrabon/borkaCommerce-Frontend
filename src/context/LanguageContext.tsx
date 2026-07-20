'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: (key: string) => string;
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
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const stored = localStorage.getItem('preferred_language') as Language | null;
    if (stored === 'ar' || stored === 'en') {
      setLanguageState(stored);
      applyLang(stored);
    }
  }, []);

  const applyLang = (lang: Language) => {
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferred_language', lang);
    applyLang(lang);
  };

  const t = (key: string): string => {
    return TRANSLATIONS[language][key] ?? TRANSLATIONS['en'][key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL: language === 'ar', t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
