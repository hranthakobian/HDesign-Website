import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.scss";
import { I18nProvider } from "@/lib/i18n";
import Header from "@/components/Header";
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

import { headers } from "next/headers";

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const personalization = await getSiteSetting('personalization_settings', {});
  const themeHue = personalization.theme_hue || "172";

  const apiSettings = await getSiteSetting('api_settings', {
    tildo_enabled: false,
    tildo_widget_id: '',
    google_analytics_enabled: false,
    google_analytics_id: '',
    custom_head_script: '',
    custom_footer_script: ''
  });

  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.endsWith('.local');

  const generalSettings = await getSiteSetting('general_settings', { upcoming_mode: false });
  const upcomingMode = isLocalhost ? false : !!generalSettings?.upcoming_mode;

  return (
    <html lang="en" data-theme="light" data-color="#083f39" style={{ "--hue": themeHue } as any}>
      <head>
        <link rel="stylesheet" href="https://api.hakobian.am/libs/v1/style.css" />
        <link rel="stylesheet" href="https://api.hakobian.am/libs/v1/icons/style.css" />
        
        <link rel="preload" href="https://api.hakobian.am/libs/v1/fonts/hdesign.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="https://api.hakobian.am/libs/v1/icons/varFonts/HDesign-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        
        {/* Google Analytics Script */}
        {apiSettings.google_analytics_enabled && apiSettings.google_analytics_id && (
          <>
            <Script 
              src={`https://www.googletagmanager.com/gtag/js?id=${apiSettings.google_analytics_id}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${apiSettings.google_analytics_id}');
              `}
            </Script>
          </>
        )}

        {/* Custom Head Scripts */}
        {apiSettings.custom_head_script && (
          <script dangerouslySetInnerHTML={{ __html: apiSettings.custom_head_script }} />
        )}
      </head>
      <body>
        <Preloader />
        <SmoothScroll />
        <CustomCursor />
        <AnalyticsTracker />
        <I18nProvider>
          <UpcomingCheck 
            initialUpcomingMode={upcomingMode}
            initialSettings={{
              upcoming_title_hy: generalSettings?.upcoming_title_hy,
              upcoming_title_en: generalSettings?.upcoming_title_en,
              upcoming_desc_hy: generalSettings?.upcoming_desc_hy,
              upcoming_desc_en: generalSettings?.upcoming_desc_en,
              upcoming_email: generalSettings?.upcoming_email,
              upcoming_tel: generalSettings?.upcoming_tel
            }}
          >
            <Header />
            <GlobalBackground />
            <PageTransition>
              {children}
            </PageTransition>
            <Footer />
          </UpcomingCheck>
        </I18nProvider>
        <Script src="https://api.hakobian.am/libs/v1/script.js" strategy="afterInteractive" />

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