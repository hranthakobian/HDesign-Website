"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavigationItem } from '@/types/builder';

interface DynamicHeaderProps {
  navigation: NavigationItem[];
  siteTitle?: string;
  logoUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  isSticky?: boolean;
}

export default function DynamicHeader({
  navigation,
  siteTitle = 'HDesign',
  logoUrl = '/logo.png',
  ctaText = 'Կապ',
  ctaUrl = '/contact',
  isSticky = true
}: DynamicHeaderProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter only visible navigation items
  const visibleNav = (navigation || []).filter((item) => item.isVisible !== false);

  // Track scroll position for sticky glass effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      data-block-id="header"
      data-block-type="header"
      style={{
        position: isSticky ? 'sticky' : 'relative',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 9998,
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        backgroundColor: isScrolled ? 'rgba(8, 63, 57, 0.85)' : 'rgba(8, 63, 57, 0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: isScrolled
          ? '1px solid rgba(20, 184, 166, 0.2)'
          : '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 24px',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Logo Section */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: '#ffffff'
          }}
        >
          {logoUrl && (
            <img
              src={logoUrl}
              alt={siteTitle}
              style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            />
          )}
          <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.5px' }}>
            {siteTitle}
          </span>
        </Link>

        {/* Desktop Dynamic Navigation Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '24px'
          }}
          className="dynamic-header-desktop-nav"
        >
          {visibleNav.map((item) => {
            const hasChildren = item.children && item.children.filter((c) => c.isVisible !== false).length > 0;
            const visibleChildren = hasChildren ? item.children!.filter((c) => c.isVisible !== false) : [];
            const isActive = pathname === item.path;

            return (
              <div
                key={item.id}
                onMouseEnter={() => hasChildren && setActiveDropdown(item.id)}
                onMouseLeave={() => hasChildren && setActiveDropdown(null)}
                style={{ position: 'relative' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Link
                    href={item.path}
                    target={item.target || '_self'}
                    style={{
                      textDecoration: 'none',
                      color: isActive ? '#14b8a6' : '#ffffff',
                      fontSize: '14px',
                      fontWeight: isActive ? 700 : 500,
                      padding: '8px 4px',
                      transition: 'color 0.15s ease'
                    }}
                  >
                    {item.title}
                  </Link>

                  {item.badge && (
                    <span
                      style={{
                        backgroundColor: '#14b8a6',
                        color: '#051311',
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}

                  {hasChildren && (
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#94a3b8',
                        transition: 'transform 0.2s',
                        transform: activeDropdown === item.id ? 'rotate(180deg)' : 'none'
                      }}
                    >
                      ▼
                    </span>
                  )}
                </div>

                {/* Submenu Dropdown */}
                {hasChildren && activeDropdown === item.id && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      minWidth: '200px',
                      backgroundColor: '#051311',
                      border: '1px solid rgba(20, 184, 166, 0.25)',
                      borderRadius: '8px',
                      padding: '8px',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      zIndex: 10000,
                      animation: 'fadeInMenu 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    {visibleChildren.map((child) => (
                      <Link
                        key={child.id}
                        href={child.path}
                        target={child.target || '_self'}
                        style={{
                          textDecoration: 'none',
                          color: '#cbd5e1',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 500,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(20, 184, 166, 0.15)';
                          e.currentTarget.style.color = '#14b8a6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#cbd5e1';
                        }}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right CTA & Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {ctaText && (
            <Link
              href={ctaUrl}
              style={{
                backgroundColor: '#14b8a6',
                color: '#051311',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'transform 0.15s ease',
                boxShadow: '0 2px 10px rgba(20, 184, 166, 0.3)'
              }}
            >
              {ctaText}
            </Link>
          )}

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="dynamic-header-mobile-toggle"
            aria-label="Մենյուի կոճակ"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '5px',
              width: '36px',
              height: '36px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <span style={{ width: '100%', height: '2px', backgroundColor: '#fff', borderRadius: '2px' }} />
            <span style={{ width: '100%', height: '2px', backgroundColor: '#fff', borderRadius: '2px' }} />
            <span style={{ width: '100%', height: '2px', backgroundColor: '#fff', borderRadius: '2px' }} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: '#083f39',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {visibleNav.map((item) => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Link
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: 600
                }}
              >
                {item.title}
              </Link>
              {item.children &&
                item.children
                  .filter((c) => c.isVisible !== false)
                  .map((child) => (
                    <Link
                      key={child.id}
                      href={child.path}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        color: '#99f6e4',
                        textDecoration: 'none',
                        fontSize: '13px',
                        paddingLeft: '16px'
                      }}
                    >
                      ↳ {child.title}
                    </Link>
                  ))}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @media (min-width: 768px) {
          .dynamic-header-desktop-nav {
            display: flex !important;
          }
          .dynamic-header-mobile-toggle {
            display: none !important;
          }
        }
        @keyframes fadeInMenu {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
}
