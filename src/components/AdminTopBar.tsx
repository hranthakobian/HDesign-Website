"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export default function AdminTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check and verify admin authentication
  const checkAuth = async () => {
    if (typeof window === "undefined") return;

    let token = localStorage.getItem("hdesign_admin_token");
    if (!token) {
      const match = document.cookie.match(/hdesign_admin_token=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
        localStorage.setItem("hdesign_admin_token", token);
      }
    }

    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    // Optimistically assume authenticated if token exists in localStorage
    setIsAuthenticated(true);

    try {
      const res = await fetch("/api/admin/verify", {
        headers: { Authorization: token },
        cache: "no-store"
      });
      if (!res.ok) {
        // Token invalid, clear it
        localStorage.removeItem("hdesign_admin_token");
        document.cookie = "hdesign_admin_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
        // Also ensure cookie is set for persistent cross-check
        document.cookie = `hdesign_admin_token=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax`;
      }
    } catch (e) {
      // Network failure, keep optimistic state
    }
  };

  useEffect(() => {
    setMounted(true);
    try {
      const savedCollapsed = localStorage.getItem("hdesign_admin_bar_collapsed");
      if (savedCollapsed === "true") {
        setIsCollapsed(true);
      }
    } catch (e) {}

    checkAuth();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "hdesign_admin_token" || e.key === null) {
        checkAuth();
      }
    };
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("hdesign-admin-auth-change", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("hdesign-admin-auth-change", handleAuthChange);
    };
  }, []);

  // Update root CSS variable and body class for layout adjustments
  useEffect(() => {
    if (typeof window === "undefined") return;

    const shouldShowBar = isAuthenticated && !pathname?.startsWith("/admin");

    if (shouldShowBar && !isCollapsed) {
      document.documentElement.style.setProperty("--admin-bar-height", "40px");
      document.body.classList.add("has-admin-bar");
    } else {
      document.documentElement.style.setProperty("--admin-bar-height", "0px");
      document.body.classList.remove("has-admin-bar");
    }

    return () => {
      document.documentElement.style.setProperty("--admin-bar-height", "0px");
      document.body.classList.remove("has-admin-bar");
    };
  }, [isAuthenticated, isCollapsed, pathname]);

  const handleLogout = () => {
    localStorage.removeItem("hdesign_admin_token");
    document.cookie = "hdesign_admin_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setIsAuthenticated(false);
    window.dispatchEvent(new Event("hdesign-admin-auth-change"));
  };

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem("hdesign_admin_bar_collapsed", String(next));
    } catch (e) {}
  };

  // Do not render anything if not mounted, not authenticated, or already in /admin
  if (!mounted || !isAuthenticated || (pathname && pathname.startsWith("/admin"))) {
    return null;
  }

  // Collapsed Floating Mode
  if (isCollapsed) {
    return (
      <div className="admin-bar-collapsed-bubble">
        <Link href="/admin" className="admin-bubble-btn" title={t("admin_bar", "dashboard", "Վարիչի վահանակ")}>
          <span className="admin-status-dot pulse" />
          <span className="hd-icon icon-Dashboard" />
          <span className="bubble-text">{t("admin_bar", "dashboard", "Վահանակ")}</span>
        </Link>
        <button 
          onClick={toggleCollapse} 
          className="admin-bubble-expand" 
          title={t("admin_bar", "expand", "Բացել վարիչի բարը")}
        >
          <span className="hd-icon icon-Chevrolt-Arrow-Bottom" />
        </button>
      </div>
    );
  }

  return (
    <aside className="hdesign-admin-top-bar" aria-label="Admin Navigation Bar">
      <div className="admin-top-bar-inner">
        {/* Left: Brand & Main Navigation CTA */}
        <div className="admin-top-bar-left">
          <div className="admin-status-badge">
            <span className="admin-status-dot pulse" />
            <span className="admin-status-label">{t("admin_bar", "admin_mode", "Վարիչի կերպ")}</span>
          </div>

          <Link 
            href="/admin" 
            className="admin-dashboard-link-btn"
            title="Գնալ վարիչի վահանակ"
          >
            <span className="hd-icon icon-Dashboard" />
            <span className="btn-text">{t("admin_bar", "dashboard", "Վարիչի վահանակ")}</span>
            <span className="btn-arrow">→</span>
          </Link>

          <div className="admin-bar-divider" />

          {/* Quick Admin Links */}
          <nav className="admin-bar-quick-nav">
            <Link 
              href="/admin/editor/case/new" 
              className="admin-quick-item"
              title="Ավելացնել նոր աշխատանք"
            >
              <span className="hd-icon icon-Plus" />
              <span>{t("admin_bar", "new_case", "Նոր աշխատանք")}</span>
            </Link>

            <Link 
              href="/admin?tab=messages" 
              className="admin-quick-item"
              title="Հաղորդագրություններ"
            >
              <span className="hd-icon icon-Mail" />
              <span>{t("admin_bar", "messages", "Նամակներ")}</span>
            </Link>

            <Link 
              href="/admin?tab=analytics" 
              className="admin-quick-item"
              title="Այցելությունների վիճակագրություն"
            >
              <span className="hd-icon icon-Eye" />
              <span>{t("admin_bar", "analytics", "Անալիտիկա")}</span>
            </Link>

            <Link 
              href="/admin?tab=general" 
              className="admin-quick-item"
              title="Կայքի հիմնական կայանքներ"
            >
              <span className="hd-icon hd-icon-settings" />
              <span>{t("admin_bar", "settings", "Կայանքներ")}</span>
            </Link>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="admin-top-bar-right">
          <button 
            type="button"
            onClick={handleLogout} 
            className="admin-bar-logout"
            title="Դուրս գալ վարիչի համակարգից"
          >
            <span className="hd-icon icon-Close" />
            <span className="logout-text">{t("admin_bar", "logout", "Դուրս գալ")}</span>
          </button>

          <button 
            type="button"
            onClick={toggleCollapse} 
            className="admin-bar-toggle-collapse"
            title={t("admin_bar", "collapse", "Ծալել վարիչի բարը")}
          >
            <span className="hd-icon icon-Chevrolt-Arrow-Top" />
          </button>
        </div>
      </div>
    </aside>
  );
}
