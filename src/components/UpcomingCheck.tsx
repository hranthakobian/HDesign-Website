"use client";

import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useEffect, useState } from 'react';

type UpcomingCheckProps = {
  initialUpcomingMode: boolean;
  initialSettings?: {
    upcoming_title_hy?: string;
    upcoming_title_en?: string;
    upcoming_desc_hy?: string;
    upcoming_desc_en?: string;
    upcoming_email?: string;
    upcoming_tel?: string;
  };
  children: React.ReactNode;
};

export default function UpcomingCheck({ initialUpcomingMode, initialSettings, children }: UpcomingCheckProps) {
  const pathname = usePathname();
  const { locale, setLocale } = useI18n();
  const [upcomingMode, setUpcomingMode] = useState(initialUpcomingMode);
  
  const [upcomingTitleHy, setUpcomingTitleHy] = useState(initialSettings?.upcoming_title_hy || 'Շուտով');
  const [upcomingTitleEn, setUpcomingTitleEn] = useState(initialSettings?.upcoming_title_en || 'Coming Soon');
  const [upcomingDescHy, setUpcomingDescHy] = useState(initialSettings?.upcoming_desc_hy || 'Մեր կորպորատիվ կայքը ժամանակավորապես անցանց է ստեղծարար փոփոխությունների և նորացման պատճառով։ Շուտով կվերադառնանք նորացված տեսքով։');
  const [upcomingDescEn, setUpcomingDescEn] = useState(initialSettings?.upcoming_desc_en || 'Our website is temporarily offline for maintenance and creative updates. We will be back soon with a fresh experience.');
  const [upcomingEmail, setUpcomingEmail] = useState(initialSettings?.upcoming_email || 'info@hdesign.am');
  const [upcomingTel, setUpcomingTel] = useState(initialSettings?.upcoming_tel || '+374 99 00 00 00');

  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
        setIsLocalhost(true);
      }
    }
  }, []);

  // Check if current path starts with admin or api, or if we are on localhost (which bypasses upcoming block)
  const isBypassed = pathname.startsWith('/admin') || pathname.startsWith('/api') || isLocalhost;

  useEffect(() => {
    if (isBypassed) return;

    // Prevent fetching on localhost client-side
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
        return;
      }
    }

    // Fetch latest general settings to verify if upcoming mode has been toggled
    async function checkUpcoming() {
      try {
        const res = await fetch(`/api/general-settings?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
          }
        });
        if (res.ok) {
          const data = await res.json();
          setUpcomingMode(data.upcoming_mode);
          setUpcomingTitleHy(data.upcoming_title_hy || 'Շուտով');
          setUpcomingTitleEn(data.upcoming_title_en || 'Coming Soon');
          setUpcomingDescHy(data.upcoming_desc_hy || 'Մեր կորպորատիվ կայքը ժամանակավորապես անցանց է ստեղծարար փոփոխությունների և նորացման պատճառով։ Շուտով կվերադառնանք նորացված տեսքով։');
          setUpcomingDescEn(data.upcoming_desc_en || 'Our website is temporarily offline for maintenance and creative updates. We will be back soon with a fresh experience.');
          setUpcomingEmail(data.upcoming_email || 'info@hdesign.am');
          setUpcomingTel(data.upcoming_tel || '+374 99 00 00 00');
        }
      } catch (err) {
        console.error('Failed to fetch upcoming mode status:', err);
      }
    }

    checkUpcoming();
  }, [pathname, isBypassed]);

  if (upcomingMode && !isBypassed) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#ffffff',
        color: '#1a1a1a',
        fontFamily: 'HDesign, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Animating vertical colorful lines in background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          justifyContent: 'space-around',
          pointerEvents: 'none',
          padding: '0 5%'
        }}>
          <div className="upcoming-line line-pink" />
          <div className="upcoming-line line-blue" />
          <div className="upcoming-line line-orange" />
          <div className="upcoming-line line-purple" />
          <div className="upcoming-line line-teal" />
        </div>

        <style>{`
          .upcoming-line {
            width: 2px;
            height: 160vh;
            position: relative;
            top: -30vh;
            filter: blur(1.5px);
            opacity: 0.15;
            will-change: transform, opacity;
          }
          
          .line-pink {
            background: linear-gradient(to bottom, transparent, #ec407a 30%, #ab47bc 70%, transparent);
            animation: slideVerticalLine 20s ease-in-out infinite alternate;
          }
          .line-blue {
            background: linear-gradient(to bottom, transparent, #0088fe 30%, #00c49f 70%, transparent);
            animation: slideVerticalLine 26s ease-in-out infinite alternate-reverse;
          }
          .line-orange {
            background: linear-gradient(to bottom, transparent, #ffbb28 30%, #ff8042 70%, transparent);
            animation: slideVerticalLine 22s ease-in-out infinite alternate;
          }
          .line-purple {
            background: linear-gradient(to bottom, transparent, #a28cfe 30%, #ff6688 70%, transparent);
            animation: slideVerticalLine 30s ease-in-out infinite alternate-reverse;
          }
          .line-teal {
            background: linear-gradient(to bottom, transparent, #083f39 30%, #89b59a 70%, transparent);
            animation: slideVerticalLine 24s ease-in-out infinite alternate;
          }

          @keyframes slideVerticalLine {
            0% {
              transform: translateY(-12vh) scaleX(1);
              opacity: 0.08;
            }
            50% {
              opacity: 0.22;
              transform: translateY(8vh) scaleX(1.8);
            }
            100% {
              transform: translateY(-4vh) scaleX(1);
              opacity: 0.11;
            }
          }

          .upcoming-content {
            animation: upcomingFadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          @keyframes upcomingFadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .upcoming-lang-btn {
            background: transparent;
            border: 1px solid rgba(0, 0, 0, 0.15);
            color: #1a1a1a;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
          }
          .upcoming-lang-btn:hover {
            border-color: #083f39;
            background: rgba(8, 63, 57, 0.05);
          }
          .upcoming-lang-btn.active {
            border-color: #083f39;
            background: #083f39;
            color: #ffffff;
          }
        `}</style>

        {/* Central visual card */}
        <div className="upcoming-content" style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '520px',
          padding: '40px 30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}>
          {/* HDesign Logo */}
          <div style={{
            marginBottom: '8px'
          }}>
            <img 
              src="/logo.png" 
              alt="HDesign Logo" 
              style={{ 
                width: '90px', 
                height: '90px', 
                objectFit: 'contain', 
                filter: 'drop-shadow(0 6px 16px rgba(8, 63, 57, 0.12))' 
              }} 
            />
          </div>

          <div>
            <h1 style={{
              fontFamily: 'HDesign, sans-serif',
              fontSize: '2.4rem',
              fontWeight: 800,
              margin: '0 0 14px',
              color: '#083f39',
              background: 'linear-gradient(135deg, #083f39 0%, #156257 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {locale === 'hy' ? upcomingTitleHy : upcomingTitleEn}
            </h1>
            <p style={{
              fontFamily: 'HDesign, sans-serif',
              fontSize: '0.96rem',
              lineHeight: '1.6',
              color: '#4a4a4a',
              margin: 0
            }}>
              {locale === 'hy' ? upcomingDescHy : upcomingDescEn}
            </p>
          </div>

          {/* Small divider */}
          <div style={{
            width: '50px',
            height: '1px',
            background: 'rgba(8, 63, 57, 0.15)',
            margin: '8px 0'
          }} />

          {/* Social and contacts info */}
          <div style={{
            fontFamily: 'HDesign, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.85rem',
            color: '#666666'
          }}>
            <div>
              Email: <a href={`mailto:${upcomingEmail}`} style={{ color: '#083f39', fontWeight: 600, textDecoration: 'none' }}>{upcomingEmail}</a>
            </div>
            <div>
              Tel: <a href={`tel:${upcomingTel.replaceAll(' ', '')}`} style={{ color: '#083f39', fontWeight: 600, textDecoration: 'none' }}>{upcomingTel}</a>
            </div>
          </div>

          {/* Language toggle switcher */}
          <div style={{ marginTop: '16px' }}>
            <hd-segment
              id="langSelector"
              value={locale}
              onChange={(e: any) => setLocale(e.target.value)}
              data-color="#083f39"
              data-inactive-color="rgba(8, 63, 57, 0.4)"
              data-width="130px"
              data-height="36px"
              data-thickness="3px"
            >
              <span value="hy" {...(locale === 'hy' ? { selected: true } : {})}>Հայ</span>
              <span value="en" {...(locale === 'en' ? { selected: true } : {})}>Eng</span>
            </hd-segment>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
