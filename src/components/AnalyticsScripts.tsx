'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { API_BASE_URL } from '@/config/api';

export default function AnalyticsScripts() {
  const [gaId, setGaId] = useState<string>(process.env.NEXT_PUBLIC_GA_ID || '');
  const [fbPixelId, setFbPixelId] = useState<string>(process.env.NEXT_PUBLIC_FB_PIXEL_ID || '');
  const [gscTag, setGscTag] = useState<string>(process.env.NEXT_PUBLIC_GSC_TAG || '');

  useEffect(() => {
    const fetchTrackingSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ecommerce/site-settings`);
        if (res.ok) {
          const settings = await res.json();
          if (settings.google_analytics_id || settings.GOOGLE_ANALYTICS_ID) {
            setGaId(settings.google_analytics_id || settings.GOOGLE_ANALYTICS_ID);
          }
          if (settings.facebook_pixel_id || settings.FACEBOOK_PIXEL_ID) {
            setFbPixelId(settings.facebook_pixel_id || settings.FACEBOOK_PIXEL_ID);
          }
          if (settings.google_search_console_tag) {
            setGscTag(settings.google_search_console_tag);
          }
        }
      } catch {
        // non-blocking fallback to env vars
      }
    };

    fetchTrackingSettings();
  }, []);

  return (
    <>
      {/* Google Search Console Verification Meta */}
      {gscTag && (
        <meta name="google-site-verification" content={gscTag.replace(/^google-site-verification=/, '')} />
      )}

      {/* Dynamic Google Analytics (gtag.js) */}
      {gaId && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <Script
            id="google-analytics-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      )}

      {/* Dynamic Meta / Facebook Pixel */}
      {fbPixelId && (
        <Script
          id="facebook-pixel-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${fbPixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}
    </>
  );
}
