import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.scss";
import { I18nProvider } from "@/lib/i18n";
import Header from "@/components/Header";
import AdminTopBar from "@/components/AdminTopBar";
import Footer from "@/components/Footer";
import GlobalBackground from "@/components/GlobalBackground";
import PageTransition from "@/components/PageTransition";
import Script from "next/script";
import CustomCursor from "@/components/CustomCursor";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import UpcomingCheck from "@/components/UpcomingCheck";
import { getSiteSetting } from "@/lib/db";
import SmoothScroll from "@/components/SmoothScroll";
import Preloader from "@/components/Preloader";
import HDesignRevealInit from "@/components/HDesignRevealInit";
import HdVideoInit from "@/components/HdVideoInit";
import GlobalFontInjector from "@/components/GlobalFontInjector";


export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const personalization = await getSiteSetting('personalization_settings', {});
  return {
    title: personalization.site_title_hy || "HDesign",
    description: personalization.site_desc_hy || "Դիզայնի և Բրենդավորման Ստուդիա"
  };
}

function extractTidioWidgetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  
  // Try to match standard Tidio code URL pattern: code.tidio.co/{id}(.js)
  const match = trimmed.match(/code\.tidio\.co\/([a-zA-Z0-9]+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  // If it's a raw alphanumeric ID
  if (/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return trimmed;
  }
  
  // Try to match any alphanumeric string of typical Tidio ID length (usually 32 chars)
  const fallbackMatch = trimmed.match(/[a-zA-Z0-9]{20,40}/);
  if (fallbackMatch) {
    return fallbackMatch[0];
  }
  
  return trimmed;
}

function extractGoogleAnalyticsId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/G-[A-Za-z0-9]+/i);
  if (match && match[0]) {
    return match[0].toUpperCase();
  }
  return trimmed;
}

import { headers } from "next/headers";

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const personalization = await getSiteSetting('personalization_settings', {});
  const themeHue = personalization.theme_hue || "172";
  const themeSaturation = personalization.theme_saturation || "77";
  const themeLightness = personalization.theme_lightness || "14";

  const apiSettings = await getSiteSetting('api_settings', {
    tildo_enabled: false,
    tildo_widget_id: '',
    google_analytics_enabled: false,
    google_analytics_id: '',
    custom_head_script: '',
    custom_footer_script: ''
  });

  const cleanGaId = extractGoogleAnalyticsId(apiSettings.google_analytics_id || '');

  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.endsWith('.local');

  const generalSettings = await getSiteSetting('general_settings', { upcoming_mode: false, upcoming_hdesign_mode: false, upcoming_pages: {} });
  const upcomingMode = !!generalSettings?.upcoming_mode;
  const upcomingHdesignMode = !!generalSettings?.upcoming_hdesign_mode;
  const upcomingPages = generalSettings?.upcoming_pages || {};

  return (
    <html lang="en" data-theme="light" data-color="#083f39" style={{
      "--hue": themeHue,
      "--saturation": themeSaturation + "%",
      "--lightness": themeLightness + "%"
    } as any}>
      <head>
        <GlobalFontInjector 
          initialFontUrl={generalSettings?.site_font_url} 
          initialFontName={generalSettings?.site_font_name} 
        />
        <link rel="stylesheet" href="https://api.hakobian.am/libs/v1/components/style.css" />

        {/* Custom Head Scripts */}
        {apiSettings.custom_head_script && (
          <script dangerouslySetInnerHTML={{ __html: apiSettings.custom_head_script }} />
        )}
      </head>
      <body>
        {/* Google Analytics (GA4) - Directly embedded */}
        <Script 
          src="https://www.googletagmanager.com/gtag/js?id=G-06C8EPETLZ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-06C8EPETLZ');
          `}
        </Script>
        <Preloader />
        <SmoothScroll />
        <HDesignRevealInit />
        <HdVideoInit />
        <CustomCursor />
        <AnalyticsTracker />
        <I18nProvider>
          <AdminTopBar />
          <Header siteTitle={{ hy: personalization.site_title_hy || "HDesign", en: personalization.site_title_en || "HDesign" }} />
          <GlobalBackground />
          <UpcomingCheck 
            initialUpcomingMode={upcomingMode}
            initialUpcomingHdesignMode={upcomingHdesignMode}
            initialUpcomingPages={upcomingPages}
            initialSettings={{
              upcoming_hdesign_mode: upcomingHdesignMode,
              upcoming_pages: upcomingPages,
              upcoming_title_hy: generalSettings?.upcoming_title_hy,
              upcoming_title_en: generalSettings?.upcoming_title_en,
              upcoming_desc_hy: generalSettings?.upcoming_desc_hy,
              upcoming_desc_en: generalSettings?.upcoming_desc_en,
              page_upcoming_title_hy: generalSettings?.page_upcoming_title_hy,
              page_upcoming_title_en: generalSettings?.page_upcoming_title_en,
              page_upcoming_desc_hy: generalSettings?.page_upcoming_desc_hy,
              page_upcoming_desc_en: generalSettings?.page_upcoming_desc_en,
              upcoming_email: generalSettings?.upcoming_email,
              upcoming_tel: generalSettings?.upcoming_tel
            }}
          >
            <PageTransition>
              {children}
            </PageTransition>
          </UpcomingCheck>
          <Footer 
            siteTitle={{ hy: personalization.site_title_hy || "HDesign", en: personalization.site_title_en || "HDesign" }} 
            contactEmail={generalSettings?.contact_email}
            contactTel={generalSettings?.contact_tel}
            contactAddressHy={generalSettings?.contact_address_hy}
            contactAddressEn={generalSettings?.contact_address_en}
          />
        </I18nProvider>
        <Script src="https://api.hakobian.am/libs/v1/components/script.js" strategy="afterInteractive" />

        {/* Tidio Chat (Tildo) script */}
        {apiSettings.tildo_enabled && apiSettings.tildo_widget_id && (
          <Script 
            src={`//code.tidio.co/${extractTidioWidgetId(apiSettings.tildo_widget_id)}.js`} 
            strategy="lazyOnload" 
          />
        )}

        {/* Custom Footer Scripts */}
        {apiSettings.custom_footer_script && (
          <script dangerouslySetInnerHTML={{ __html: apiSettings.custom_footer_script }} />
        )}
      </body>
    </html>
  );
}