"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [transitionState, setTransitionState] = useState<'idle' | 'leaving' | 'entering'>('idle');
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
    setTransitionState('leaving');

    let enterTimer: NodeJS.Timeout;
    const leaveTimer = setTimeout(() => {
      // Switch to new content only AFTER leave animation completes
      setDisplayChildren(pendingChildrenRef.current);
      setTransitionState('entering');

      enterTimer = setTimeout(() => {
        // Complete transition and go idle
        setTransitionState('idle');
      }, 320); // matches CSS transition duration for pageSlideEnter
    }, 280); // matches CSS transition duration for pageSlideLeave

    return () => {
      clearTimeout(leaveTimer);
      if (enterTimer) clearTimeout(enterTimer);
    };
  }, [pathname]);

  return (
    <div className={`page-transition-wrapper state-${transitionState}`}>
      {displayChildren}
    </div>
  );
}

