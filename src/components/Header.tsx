"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { saveSettingsToSupabase } from "@/lib/settingsSync";

function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function applyCustomThemeColor(hexColor: string) {
  if (typeof window === 'undefined') return;
  const rgb = hexToRgb(hexColor);
  if (!rgb) return;
  const { r, g, b } = rgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isLight = luminance > 0.5;

  const root = document.documentElement;
  root.style.setProperty('--custom-bg', hexColor);
  
  if (isLight) {
    root.style.setProperty('--custom-text', '#083f39');
    root.style.setProperty('--custom-muted', 'rgba(8, 63, 57, 0.6)');
    root.style.setProperty('--custom-panel', 'rgba(255, 255, 255, 0.7)');
    root.style.setProperty('--custom-panel-border', 'rgba(8, 63, 57, 0.08)');
    root.style.setProperty('--custom-primary', '#083f39');
    root.style.setProperty('--custom-btn-bg', 'rgba(8, 63, 57, 0.04)');
    root.style.setProperty('--custom-btn-hover-bg', 'rgba(8, 63, 57, 0.08)');
    root.style.setProperty('--custom-input-bg', 'rgba(8, 63, 57, 0.03)');
    root.style.setProperty('--custom-input-border', 'rgba(8, 63, 57, 0.12)');
    root.style.setProperty('--custom-switcher-bg', 'rgba(8, 63, 57, 0.06)');
    root.style.setProperty('--custom-switcher-border', 'rgba(8, 63, 57, 0.15)');
    root.style.setProperty('--custom-switcher-capsule-bg', '#083f39');
    root.style.setProperty('--custom-switcher-text-active', '#ffffff');
    root.style.setProperty('--custom-switcher-text-inactive', 'rgba(8, 63, 57, 0.8)');
    root.style.setProperty('--custom-lang-active', '#ffffff');
    root.style.setProperty('--custom-lang-inactive', 'rgba(8, 63, 57, 0.75)');
    root.style.setProperty('--custom-nav-bg', 'rgba(255, 255, 255, 0.85)');
  } else {
    root.style.setProperty('--custom-text', '#ffffff');
    root.style.setProperty('--custom-muted', 'rgba(255, 255, 255, 0.45)');
    root.style.setProperty('--custom-panel', 'rgba(255, 255, 255, 0.05)');
    root.style.setProperty('--custom-panel-border', 'rgba(255, 255, 255, 0.05)');
    root.style.setProperty('--custom-primary', '#ffffff');
    root.style.setProperty('--custom-btn-bg', 'rgba(255, 255, 255, 0.05)');
    root.style.setProperty('--custom-btn-hover-bg', 'rgba(255, 255, 255, 0.1)');
    root.style.setProperty('--custom-input-bg', 'rgba(255, 255, 255, 0.04)');
    root.style.setProperty('--custom-input-border', 'rgba(255, 255, 255, 0.08)');
    root.style.setProperty('--custom-switcher-bg', 'rgba(0, 0, 0, 0.25)');
    root.style.setProperty('--custom-switcher-border', 'rgba(255, 255, 255, 0.08)');
    root.style.setProperty('--custom-switcher-capsule-bg', 'rgba(255, 255, 255, 0.15)');
    root.style.setProperty('--custom-switcher-text-active', '#ffffff');
    root.style.setProperty('--custom-switcher-text-inactive', 'rgba(255, 255, 255, 0.5)');
    root.style.setProperty('--custom-lang-active', '#0f172a');
    root.style.setProperty('--custom-lang-inactive', 'rgba(255, 255, 255, 0.55)');
    root.style.setProperty('--custom-nav-bg', 'rgba(255, 255, 255, 0.1)');
  }
}

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
  const [theme, setTheme] = useState<'light' | 'dark' | 'green' | 'custom'>('light');
  const [customColor, setCustomColor] = useState<string>('#7c3aed');

  // Portfolio Page Header States
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);

  // Track search parameters (for dynamic active states like works categories)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkCategory = () => {
        const params = new URLSearchParams(window.location.search);
        setCurrentCategory(params.get('category'));
      };
      checkCategory();
      const interval = setInterval(checkCategory, 200);
      return () => clearInterval(interval);
    }
  }, []);

  // Close mobile menu on pathname change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Track theme changes
  useEffect(() => {
    const savedTheme = localStorage.getItem('hdesign-theme') as 'light' | 'dark' | 'green' | 'custom';
    const savedCustomColor = localStorage.getItem('hdesign-custom-color') || '#7c3aed';
    setCustomColor(savedCustomColor);

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
      if (savedTheme === 'custom') {
        applyCustomThemeColor(savedCustomColor);
      } else {
        document.documentElement.setAttribute('data-color', savedTheme === 'light' ? '#083f39' : '#ffffff');
        document.documentElement.classList.remove('light', 'dark', 'green', 'custom');
        document.documentElement.classList.add(savedTheme);
      }
    } else {
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.setAttribute('data-color', '#083f39');
      document.documentElement.classList.remove('light', 'dark', 'green', 'custom');
      document.documentElement.classList.add('light');
    }

    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem('hdesign-theme') as 'light' | 'dark' | 'green' | 'custom';
      if (currentTheme) {
        setTheme(currentTheme);
        document.documentElement.classList.remove('light', 'dark', 'green', 'custom');
        document.documentElement.classList.add(currentTheme);
        if (currentTheme === 'custom') {
          const col = localStorage.getItem('hdesign-custom-color') || '#7c3aed';
          applyCustomThemeColor(col);
        }
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

  const changeTheme = (newTheme: 'light' | 'dark' | 'green' | 'custom') => {
    setTheme(newTheme);
    localStorage.setItem('hdesign-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    if (newTheme === 'custom') {
      applyCustomThemeColor(customColor);
    } else {
      document.documentElement.setAttribute('data-color', newTheme === 'light' ? '#083f39' : '#ffffff');
      document.documentElement.classList.remove('light', 'dark', 'green', 'custom');
      document.documentElement.classList.add(newTheme);
      // clean style attributes for custom color
      document.documentElement.style.removeProperty('--custom-bg');
      document.documentElement.style.removeProperty('--custom-text');
      document.documentElement.style.removeProperty('--custom-muted');
      document.documentElement.style.removeProperty('--custom-panel');
      document.documentElement.style.removeProperty('--custom-panel-border');
      document.documentElement.style.removeProperty('--custom-primary');
      document.documentElement.style.removeProperty('--custom-btn-bg');
      document.documentElement.style.removeProperty('--custom-btn-hover-bg');
      document.documentElement.style.removeProperty('--custom-input-bg');
      document.documentElement.style.removeProperty('--custom-input-border');
      document.documentElement.style.removeProperty('--custom-switcher-bg');
      document.documentElement.style.removeProperty('--custom-switcher-border');
      document.documentElement.style.removeProperty('--custom-switcher-capsule-bg');
      document.documentElement.style.removeProperty('--custom-switcher-text-active');
      document.documentElement.style.removeProperty('--custom-switcher-text-inactive');
      document.documentElement.style.removeProperty('--custom-lang-active');
      document.documentElement.style.removeProperty('--custom-lang-inactive');
      document.documentElement.style.removeProperty('--custom-nav-bg');
    }

    // Save settings to Supabase
    const currentLang = localStorage.getItem('hdesign_locale') || 'hy';
    saveSettingsToSupabase(newTheme, currentLang);
  };

  const handleCustomColorChange = (newColor: string) => {
    setCustomColor(newColor);
    localStorage.setItem('hdesign-custom-color', newColor);
    if (theme === 'custom') {
      applyCustomThemeColor(newColor);
    }
  };


  // Helper function to render active navigation item styling
  const renderNavLinkText = (id: string, text: string, hasDropdown: boolean = false) => {
    return (
      <span className="nav-item-text-wrapper">
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
        
        {hasDropdown && (
          <span className="hd-icon hd-icon-chevrolt-arrow-bottom dropdown-chevron" style={{ fontSize: "0.6rem", marginLeft: "6px", display: "inline-block", transform: "rotate(0deg)", transition: "transform 0.3s ease" }} />
        )}
        
        {/* Right Side Double Lines */}
        <div className="nav-double-lines right-side">
          <svg className="nav-line line-top" width="3" height="28" viewBox="0 0 3 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 1.5V25.7963" stroke="#4A897C" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <svg className="nav-line line-bottom" width="3" height="28" viewBox="0 0 3 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 1.5V25.7963" stroke="#4A897C" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
      </span>
    );
  };

  // ══════ RENDER PORTFOLIO HOME HEADER ══════
  const isPortfolioPage = pathname === "/" || pathname === "/about" || pathname.startsWith("/works") || pathname === "/contact" || pathname.startsWith("/hdesign") || pathname.startsWith("/fonts");
  const getActiveNav = () => {
    if (pathname === "/about") return "about";
    if (pathname.startsWith("/works")) return "works";
    if (pathname.startsWith("/fonts")) return "fonts";
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
        {/* Logo Section */}
        <Link href="/" className="portfolio-logo-panel" onClick={() => setIsMobileMenuOpen(false)}>
          <img 
            src="/logo.png" 
            alt="HDesign Logo" 
            style={{ width: "38px", height: "38px", objectFit: "contain", borderRadius: "8px" }} 
          />
          <div className="logo-text">
            <span style={{ fontWeight: 800, fontSize: "0.95rem", letterSpacing: "0.5px" }}>Հրանտ</span>
            <span style={{ fontWeight: 500, fontSize: "0.85rem", opacity: 0.8 }}>Հակոբյան</span>
          </div>
        </Link>

        <header className="portfolio-header">

          {/* Navigation Links */}
          <nav className="portfolio-nav">
            <Link href="/" className={`portfolio-nav-item ${activeNav === "home" ? "active" : ""}`}>
              {renderNavLinkText("home", t('nav', 'home', 'Տուն'))}
            </Link>
            <Link href="/about" className={`portfolio-nav-item ${activeNav === "about" ? "active" : ""}`}>
              {renderNavLinkText("about", t('nav', 'about', 'Մասին'))}
            </Link>
             {/* Աշխատանքներ Dropdown */}
             <div className="header-dropdown-container">
               <Link href="/works" className={`portfolio-nav-item header-dropdown-trigger ${activeNav === "works" ? "active" : ""}`} style={{ cursor: "pointer", userSelect: "none" }}>
                 {renderNavLinkText("works", t('nav', 'works', 'Աշխատանքներ'), true)}
               </Link>
               <div className="header-dropdown-menu">
                 <div className="dropdown-menu-bg" />
                 <Link href="/works?category=branding" className={`header-dropdown-item ${pathname === "/works" && currentCategory === "branding" ? "active" : ""}`}>
                   {renderNavLinkText("works-branding", t('nav', 'works_branding', 'Բրենդինգներ'))}
                 </Link>
                 <Link href="/works?category=design" className={`header-dropdown-item ${pathname === "/works" && currentCategory === "design" ? "active" : ""}`}>
                   {renderNavLinkText("works-design", t('nav', 'works_design', 'Դիզայն'))}
                 </Link>
               </div>
             </div>
            <Link href="/fonts" className={`portfolio-nav-item ${activeNav === "fonts" ? "active" : ""}`}>
              {renderNavLinkText("fonts", t('nav', 'fonts', 'Տառատեսակներ'))}
            </Link>

            {/* HDesign Dropdown as a regular link with dropdown list */}
            <div className="header-dropdown-container hide-on-tablet">
               <Link href="/hdesign" className={`portfolio-nav-item header-dropdown-trigger ${activeNav === "hdesign" ? "active" : ""}`} style={{ cursor: "pointer", userSelect: "none" }}>
                 {renderNavLinkText("hdesign", "HDesign", true)}
               </Link>
               <div className="header-dropdown-menu">
                <div className="dropdown-menu-bg" />
                <Link href="/hdesign" className={`header-dropdown-item ${pathname === "/hdesign" ? "active" : ""}`}>
                  {renderNavLinkText("hdesign-general", t('nav', 'general', 'Ընդհանուր'))}
                </Link>
                <Link href="/hdesign/docs" className={`header-dropdown-item ${pathname === "/hdesign/docs" ? "active" : ""}`}>
                  {renderNavLinkText("hdesign-docs", t('nav', 'docs', 'Փաստաթղթեր'))}
                </Link>
                <Link href="/hdesign/samples" className={`header-dropdown-item ${pathname === "/hdesign/samples" ? "active" : ""}`}>
                  {renderNavLinkText("hdesign-samples", t('nav', 'samples', 'Փորձանմուշներ'))}
                </Link>
              </div>
            </div>

            <Link href="/contact" className={`portfolio-nav-item hide-on-tablet ${activeNav === "contact" ? "active" : ""}`}>
              {renderNavLinkText("contact", t('nav', 'contact', 'Կապ'))}
            </Link>

            {/* Ավելին Dropdown (Visible on Tablet/Medium viewports only) */}
            <div className="header-dropdown-container show-on-tablet-only">
               <span className="portfolio-nav-item header-dropdown-trigger" style={{ cursor: "pointer", userSelect: "none" }}>
                 {renderNavLinkText("more", t('nav', 'more', 'Ավելին'), true)}
               </span>
               <div className="header-dropdown-menu more-dropdown-menu">
                 <div className="dropdown-menu-bg" />
                 
                 {/* HDesign sub-group */}
                 <div className="more-dropdown-sub-group">
                   <span className="more-dropdown-sub-group-title">HDesign</span>
                   <Link href="/hdesign" className={`header-dropdown-item ${pathname === "/hdesign" ? "active" : ""}`}>
                     {renderNavLinkText("hdesign-general-more", t('nav', 'general', 'Ընդհանուր'))}
                   </Link>
                   <Link href="/hdesign/docs" className={`header-dropdown-item ${pathname === "/hdesign/docs" ? "active" : ""}`}>
                     {renderNavLinkText("hdesign-docs-more", t('nav', 'docs', 'Փաստաթղթեր'))}
                   </Link>
                   <Link href="/hdesign/samples" className={`header-dropdown-item ${pathname === "/hdesign/samples" ? "active" : ""}`}>
                     {renderNavLinkText("hdesign-samples-more", t('nav', 'samples', 'Փորձանմուշներ'))}
                   </Link>
                 </div>
                 
                 <div className="more-dropdown-divider" />
                 
                 {/* Contact link */}
                 <Link href="/contact" className={`header-dropdown-item ${pathname === "/contact" ? "active" : ""}`}>
                   {renderNavLinkText("contact-more", t('nav', 'contact', 'Կապ'))}
                 </Link>
               </div>
            </div>
          </nav>

          {/* 4-Line Hamburger Button & Label */}
          <div 
            className="hamburger-wrapper"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ cursor: 'pointer' }}
          >
            <span className="hamburger-text">{t('nav', 'menu', 'Ցանկ')}</span>
            <div 
              className={`hamburger-btn ${isMobileMenuOpen ? "open" : ""}`} 
              aria-label="Toggle navigation menu"
            >
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </header>

        {/* Desktop Controls (Language & Theme Switcher) */}
        <div className="portfolio-header-controls">
          <hd-segment
            id="langSelectorDesktop"
            value={locale}
            onChange={(e: any) => setLocale(e.target.value)}
            data-width="130px"
            data-height="34px"
            data-thickness="3px"
          >
            <span value="hy" {...(locale === 'hy' ? { selected: true } : {})}>Հայ</span>
            <span value="en" {...(locale === 'en' ? { selected: true } : {})}>Eng</span>
          </hd-segment>

          <div className="desktop-theme-select-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <hd-select
              id="themeSelectorDesktop"
              value={theme}
              onChange={(e: any) => changeTheme(e.target.value)}
              data-width="120px"
              data-height="34px"
              data-thickness="3px"
              placeholder={t('nav', 'theme', 'Թեմա')}
            >
              <span value="light" {...(theme === 'light' ? { selected: true } : {})}>{t('nav', 'theme_light', 'Բաց')}</span>
              <span value="dark" {...(theme === 'dark' ? { selected: true } : {})}>{t('nav', 'theme_dark', 'Մութ')}</span>
              <span value="green" {...(theme === 'green' ? { selected: true } : {})}>{t('nav', 'theme_green', 'Կանաչ')}</span>
              <span value="custom" {...(theme === 'custom' ? { selected: true } : {})}>{t('nav', 'theme_custom', 'Գույն')}</span>
            </hd-select>
            
            {theme === 'custom' && (
              <div className="custom-color-picker-wrapper">
                <hd-color-picker
                  data-color={customColor}
                  onChange={(e: any) => handleCustomColorChange(e.target.value)}
                  data-width="34px"
                  data-height="34px"
                />
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Drawer Overlay */}
        <div className={`mobile-menu-drawer ${isMobileMenuOpen ? "open" : ""}`}>
          <nav className="mobile-nav-links">
            <Link href="/" className={`mobile-nav-item ${activeNav === "home" ? "active" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
              {t('nav', 'home', 'Տուն')}
            </Link>
            <Link href="/about" className={`mobile-nav-item ${activeNav === "about" ? "active" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
              {t('nav', 'about', 'Մասին')}
            </Link>
             <Link href="/works" className={`mobile-nav-item ${activeNav === "works" ? "active" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
              {t('nav', 'works', 'Աշխատանքներ')}
            </Link>
            <Link href="/fonts" className={`mobile-nav-item ${activeNav === "fonts" ? "active" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
              {t('nav', 'fonts', 'Տառատեսակներ')}
            </Link>
            <div className="mobile-nav-divider" />
            
            <span className="mobile-nav-section-title">HDesign</span>
            <Link href="/hdesign" className={`mobile-nav-subitem ${pathname === "/hdesign" ? "active" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
              {t('nav', 'general', 'Ընդհանուր')}
            </Link>
            <Link href="/hdesign/docs" className={`mobile-nav-subitem ${pathname === "/hdesign/docs" ? "active" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
              {t('nav', 'docs', 'Փաստաթղթեր')}
            </Link>
             <Link href="/hdesign/samples" className={`mobile-nav-subitem ${pathname === "/hdesign/samples" ? "active" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
              {t('nav', 'samples', 'Փորձանմուշներ')}
            </Link>

            <div className="mobile-nav-divider" />

            <Link href="/contact" className={`mobile-nav-item ${activeNav === "contact" ? "active" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
              {t('nav', 'contact', 'Կապ')}
            </Link>

            <div className="mobile-nav-divider" />

            {/* Mobile Settings Row (Language & Theme switchers) */}
            <div className="mobile-settings-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px', width: '100%' }}>
              <span className="mobile-nav-section-title">{t('nav', 'settings', 'Կարգավորումներ')}</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                {/* Language Toggle */}
                <div style={{ width: '100%' }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: "6px" }}>{t('nav', 'language', 'Լեզու')}</span>
                  <hd-segment
                    id="langSelectorMobile"
                    value={locale}
                    onChange={(e: any) => setLocale(e.target.value)}
                    data-width="100%"
                    data-height="36px"
                    data-thickness="3px"
                  >
                    <span value="hy" {...(locale === 'hy' ? { selected: true } : {})}>Հայ</span>
                    <span value="en" {...(locale === 'en' ? { selected: true } : {})}>Eng</span>
                  </hd-segment>
                </div>

                {/* Theme Switcher Toggle */}
                <div style={{ width: '100%' }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: "6px" }}>{t('nav', 'theme', 'Թեմա')}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                    <hd-select
                      id="themeSelectorMobile"
                      value={theme}
                      onChange={(e: any) => changeTheme(e.target.value)}
                      data-width="100%"
                      data-height="36px"
                      data-thickness="3px"
                      placeholder={t('nav', 'theme', 'Թեմա')}
                    >
                      <span value="light" {...(theme === 'light' ? { selected: true } : {})}>{t('nav', 'theme_light', 'Բաց')}</span>
                      <span value="dark" {...(theme === 'dark' ? { selected: true } : {})}>{t('nav', 'theme_dark', 'Մութ')}</span>
                      <span value="green" {...(theme === 'green' ? { selected: true } : {})}>{t('nav', 'theme_green', 'Կանաչ')}</span>
                      <span value="custom" {...(theme === 'custom' ? { selected: true } : {})}>{t('nav', 'theme_custom', 'Գույն')}</span>
                    </hd-select>
                    
                    {theme === 'custom' && (
                      <hd-color-picker
                        data-color={customColor}
                        onChange={(e: any) => handleCustomColorChange(e.target.value)}
                        data-width="36px"
                        data-height="36px"
                      />
                    )}
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
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>HDesign</span>
        </Link>

        {/* Smooth Language Switcher Toggle */}
        <hd-segment
          id="langSelector"
          value={locale}
          onChange={(e: any) => setLocale(e.target.value)}
          data-width="130px"
          data-height="36px"
          data-thickness="3px"
        >
          <span value="hy" {...(locale === 'hy' ? { selected: true } : {})}>Հայ</span>
          <span value="en" {...(locale === 'en' ? { selected: true } : {})}>Eng</span>
        </hd-segment>

        {/* Premium Theme Switcher 4-Way Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <hd-select
            id="themeSelectorLegacy"
            value={theme}
            onChange={(e: any) => changeTheme(e.target.value)}
            data-width="120px"
            data-height="36px"
            data-thickness="3px"
            placeholder={t('nav', 'theme', 'Թեմա')}
          >
            <span value="light" {...(theme === 'light' ? { selected: true } : {})}>{t('nav', 'theme_light', 'Բաց')}</span>
            <span value="dark" {...(theme === 'dark' ? { selected: true } : {})}>{t('nav', 'theme_dark', 'Մութ')}</span>
            <span value="green" {...(theme === 'green' ? { selected: true } : {})}>{t('nav', 'theme_green', 'Կանաչ')}</span>
            <span value="custom" {...(theme === 'custom' ? { selected: true } : {})}>{t('nav', 'theme_custom', 'Գույն')}</span>
          </hd-select>
          
          {theme === 'custom' && (
            <hd-color-picker
              data-color={customColor}
              onChange={(e: any) => handleCustomColorChange(e.target.value)}
              data-width="36px"
              data-height="36px"
            />
          )}
        </div>
      </div>

    </>
  );
}
