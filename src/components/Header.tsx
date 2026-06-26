"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { saveSettingsToSupabase } from "@/lib/settingsSync";

const LogoLegacy = () => (
  <img 
    src="/logo.png" 
    alt="HDesign Logo" 
    style={{ width: "32px", height: "32px", objectFit: "contain" }} 
  />
);

export default function Header() {
  const { locale, setLocale, t } = useI18n();
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark' | 'green'>('light');

  // Portfolio Page Header States
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on pathname change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Track theme changes
  useEffect(() => {
    const savedTheme = localStorage.getItem('hdesign-theme') as 'light' | 'dark' | 'green';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
      document.documentElement.setAttribute('data-color', savedTheme === 'light' ? '#083f39' : '#ffffff');
      document.documentElement.classList.remove('light', 'dark', 'green');
      document.documentElement.classList.add(savedTheme);
    } else {
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.setAttribute('data-color', '#083f39');
      document.documentElement.classList.remove('light', 'dark', 'green');
      document.documentElement.classList.add('light');
    }

    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem('hdesign-theme') as 'light' | 'dark' | 'green';
      if (currentTheme) {
        setTheme(currentTheme);
        document.documentElement.classList.remove('light', 'dark', 'green');
        document.documentElement.classList.add(currentTheme);
      }
    };

    window.addEventListener('hdesign-theme-change', handleThemeChange);
    return () => window.removeEventListener('hdesign-theme-change', handleThemeChange);
  }, []);

  // Track scrolling on the portfolio page
  useEffect(() => {
    const isPortfolioPage = pathname === "/" || pathname === "/about" || pathname.startsWith("/works") || pathname === "/contact" || pathname.startsWith("/hdesign");
    if (!isPortfolioPage) return;

    const handleScroll = () => {
      const sy = window.scrollY;
      setIsScrolled(sy > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once at load
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const changeTheme = (newTheme: 'light' | 'dark' | 'green') => {
    setTheme(newTheme);
    localStorage.setItem('hdesign-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.setAttribute('data-color', newTheme === 'light' ? '#083f39' : '#ffffff');
    document.documentElement.classList.remove('light', 'dark', 'green');
    document.documentElement.classList.add(newTheme);

    // Save settings to Supabase
    const currentLang = localStorage.getItem('hdesign_locale') || 'hy';
    saveSettingsToSupabase(newTheme, currentLang);
  };

  // Helper function to render active navigation item styling
  const renderNavLinkText = (id: string, text: string) => {
    return (
      <>
        {/* Left Side Double Lines */}
        <div className="nav-double-lines left-side">
          <svg className="nav-line line-top" width="3" height="28" viewBox="0 0 3 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 1.5V25.7963" stroke="#4A897C" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <svg className="nav-line line-bottom" width="3" height="28" viewBox="0 0 3 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 1.5V25.7963" stroke="#4A897C" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
        
        <span className="nav-item-text">{text}</span>
        
        {/* Right Side Double Lines */}
        <div className="nav-double-lines right-side">
          <svg className="nav-line line-top" width="3" height="28" viewBox="0 0 3 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 1.5V25.7963" stroke="#4A897C" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <svg className="nav-line line-bottom" width="3" height="28" viewBox="0 0 3 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 1.5V25.7963" stroke="#4A897C" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
      </>
    );
  };

  // ══════ RENDER PORTFOLIO HOME HEADER ══════
  const isPortfolioPage = pathname === "/" || pathname === "/about" || pathname.startsWith("/works") || pathname === "/contact" || pathname.startsWith("/hdesign");
  const getActiveNav = () => {
    if (pathname === "/about") return "about";
    if (pathname.startsWith("/works")) return "works";
    if (pathname === "/contact") return "contact";
    if (pathname.startsWith("/hdesign")) return "hdesign";
    if (pathname === "/") return "home";
    return "";
  };
  const activeNav = getActiveNav();

  if (pathname && pathname.startsWith("/admin")) {
    return null;
  }

  if (isPortfolioPage) {
    return (
      <div className={`portfolio-header-wrapper ${isScrolled ? "scrolled" : ""} ${isMobileMenuOpen ? "menu-open" : ""}`}>
        <header className="portfolio-header">
          {/* Logo Section */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "var(--text)" }} onClick={() => setIsMobileMenuOpen(false)}>
            <img 
              src="/logo.png" 
              alt="HDesign Logo" 
              style={{ width: "38px", height: "38px", objectFit: "contain", borderRadius: "8px" }} 
            />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.1" }}>
              <span style={{ fontWeight: 800, fontSize: "0.95rem", letterSpacing: "0.5px" }}>Հրանթ</span>
              <span style={{ fontWeight: 500, fontSize: "0.85rem", opacity: 0.8 }}>Հակոբյան</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="portfolio-nav">
            <Link href="/" className={`portfolio-nav-item ${activeNav === "home" ? "active" : ""}`}>
              {renderNavLinkText("home", "Տուն")}
            </Link>
            <Link href="/about" className={`portfolio-nav-item ${activeNav === "about" ? "active" : ""}`}>
              {renderNavLinkText("about", "Մասին")}
            </Link>
            <Link href="/works" className={`portfolio-nav-item ${activeNav === "works" ? "active" : ""}`}>
              {renderNavLinkText("works", "Աշխատանքներ")}
            </Link>
            <Link href="/contact" className={`portfolio-nav-item ${activeNav === "contact" ? "active" : ""}`}>
              {renderNavLinkText("contact", "Կապ")}
            </Link>

            {/* HDesign Dropdown as a regular link with dropdown list */}
            <div className="header-dropdown-container">
              <Link href="/hdesign" className={`portfolio-nav-item header-dropdown-trigger ${activeNav === "hdesign" ? "active" : ""}`} style={{ cursor: "pointer", userSelect: "none" }}>
                {renderNavLinkText("hdesign", "HDesign")}
              </Link>
              <div className="header-dropdown-menu">
                <Link href="/hdesign" className={`header-dropdown-item ${pathname === "/hdesign" ? "active" : ""}`}>Ընդհանուր</Link>
                <Link href="/hdesign/docs" className={`header-dropdown-item ${pathname === "/hdesign/docs" ? "active" : ""}`}>Փաստաթղթեր</Link>
                <Link href="/hdesign/samples" className={`header-dropdown-item ${pathname === "/hdesign/samples" ? "active" : ""}`}>Փորձանմուշներ</Link>
              </div>
            </div>
          </nav>

          {/* 4-Line Hamburger Button */}
          <div 
            className={`hamburger-btn ${isMobileMenuOpen ? "open" : ""}`} 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{ cursor: 'pointer' }}
          >
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </header>

        {/* Mobile Menu Drawer Overlay */}
        <div className={`mobile-menu-drawer ${isMobileMenuOpen ? "open" : ""}`}>
          <nav className="mobile-nav-links">
            <Link href="/" className={`mobile-nav-item ${activeNav === "home" ? "active" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
              Տուն
            </Link>
            <Link href="/about" className={`mobile-nav-item ${activeNav === "about" ? "active" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
              Մասին
            </Link>
            <Link href="/works" className={`mobile-nav-item ${activeNav === "works" ? "active" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
              Աշխատանքներ
            </Link>
            <Link href="/contact" className={`mobile-nav-item ${activeNav === "contact" ? "active" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
              Կապ
            </Link>
            
            <div className="mobile-nav-divider" />
            
            <span className="mobile-nav-section-title">HDesign</span>
            <Link href="/hdesign" className={`mobile-nav-subitem ${pathname === "/hdesign" ? "active" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
              Ընդհանուր
            </Link>
            <Link href="/hdesign/docs" className={`mobile-nav-subitem ${pathname === "/hdesign/docs" ? "active" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
              Փաստաթղթեր
            </Link>
            <Link href="/hdesign/samples" className={`mobile-nav-subitem ${pathname === "/hdesign/samples" ? "active" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
              Փորձանմուշներ
            </Link>

            <div className="mobile-nav-divider" />

            {/* Mobile Settings Row (Language & Theme switchers) */}
            <div className="mobile-settings-container">
              <span className="mobile-nav-section-title">Կարգավորումներ</span>
              
              <div className="mobile-settings-row">
                {/* Language Toggle */}
                <hd-segment
                  id="langSelectorMobile"
                  value={locale}
                  onChange={(e: any) => setLocale(e.target.value)}
                  data-color="var(--primary-color)"
                  data-inactive-color="var(--lang-inactive-color)"
                  data-width="130px"
                  data-height="36px"
                  data-thickness="1px"
                >
                  <span value="hy" {...(locale === 'hy' ? { selected: true } : {})}>Հայ</span>
                  <span value="en" {...(locale === 'en' ? { selected: true } : {})}>Eng</span>
                </hd-segment>

                {/* Theme Switcher Toggle */}
                <div className="mobile-theme-switcher">
                  <div onClick={() => changeTheme('light')} className={`theme-btn ${theme === 'light' ? 'active' : ''}`}>
                    Բաց
                  </div>
                  <div onClick={() => changeTheme('dark')} className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}>
                    Մութ
                  </div>
                  <div onClick={() => changeTheme('green')} className={`theme-btn ${theme === 'green' ? 'active' : ''}`}>
                    Կանաչ
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>
    );
  }

  // ══════ RENDER LEGACY HEADER (for other subpages) ══════
  const isActive = (path: string) => pathname === path;
  const activeIndex = isActive("/") ? 0 : isActive("/pattern") ? 1 : 2;

  return (
    <>
      {/* Top Left Logo & Language Toggle Panel */}
      <div className="legacy-header-panel" style={{ 
        position: 'fixed', 
        top: '20px', 
        left: '40px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '24px', 
        padding: '8px 20px',
        background: 'var(--logo-panel-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--panel-border)',
        zIndex: 1000,
        transition: 'all 0.3s ease'
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text)' }}>
          <LogoLegacy />
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>HDesign</span>
        </Link>

        {/* Smooth Language Switcher Toggle */}
        <hd-segment
          id="langSelector"
          value={locale}
          onChange={(e: any) => setLocale(e.target.value)}
          data-color="var(--primary-color)"
          data-inactive-color="var(--lang-inactive-color)"
          data-width="130px"
          data-height="36px"
          data-thickness="1px"
        >
          <span value="hy" {...(locale === 'hy' ? { selected: true } : {})}>Հայ</span>
          <span value="en" {...(locale === 'en' ? { selected: true } : {})}>Eng</span>
        </hd-segment>

        {/* Premium Theme Switcher 3-Way Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--switcher-bg)', border: '1px solid var(--switcher-border)', borderRadius: '20px', padding: '2px', position: 'relative', height: '36px', width: '160px', userSelect: 'none', transition: 'all 0.3s ease' }}>
          {/* sliding capsule */}
          <div style={{
            position: 'absolute',
            top: '2px',
            left: theme === 'light' ? '2px' : theme === 'dark' ? '54px' : '104px',
            width: '54px',
            height: '30px',
            background: 'var(--switcher-capsule-bg)',
            borderRadius: '16px',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1
          }} />
          
          <div 
            onClick={() => changeTheme('light')}
            style={{ flex: 1, border: 'none', background: 'transparent', color: theme === 'light' ? 'var(--switcher-text-active)' : 'var(--switcher-text-inactive)', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', zIndex: 2, position: 'relative', textAlign: 'center', transition: 'color 0.2s', padding: 0 }}
          >
            {t('common', 'theme_light', 'Բաց')}
          </div>
          <div 
            onClick={() => changeTheme('dark')}
            style={{ flex: 1, border: 'none', background: 'transparent', color: theme === 'dark' ? 'var(--switcher-text-active)' : 'var(--switcher-text-inactive)', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', zIndex: 2, position: 'relative', textAlign: 'center', transition: 'color 0.2s', padding: 0 }}
          >
            {t('common', 'theme_dark', 'Մութ')}
          </div>
          <div 
            onClick={() => changeTheme('green')}
            style={{ flex: 1, border: 'none', background: 'transparent', color: theme === 'green' ? 'var(--switcher-text-active)' : 'var(--switcher-text-inactive)', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', zIndex: 2, position: 'relative', textAlign: 'center', transition: 'color 0.2s', padding: 0 }}
          >
            {t('common', 'theme_green', 'Կանաչ')}
          </div>
        </div>
      </div>

    </>
  );
}
