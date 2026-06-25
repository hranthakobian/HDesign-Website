"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isLeaving, setIsLeaving] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const prevPathRef = useRef(pathname);

  // Keep latest children in a ref so the timeout always has access to the
  // most up-to-date page without making it an effect dependency
  const pendingChildrenRef = useRef(children);
  pendingChildrenRef.current = children;

  useEffect(() => {
    // Only react to pathname changes
    if (pathname === prevPathRef.current) return;
    prevPathRef.current = pathname;

    // Start leave animation (old content fades out)
    setIsLeaving(true);

    const timer = setTimeout(() => {
      // Switch to new content only AFTER leave animation completes
      setDisplayChildren(pendingChildrenRef.current);
      setIsLeaving(false);
    }, 280); // matches CSS transition duration

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className={`page-transition-wrapper ${isLeaving ? "page-leave" : "page-enter"}`}>
      {displayChildren}
    </div>
  );
}

