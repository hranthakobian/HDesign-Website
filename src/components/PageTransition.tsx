"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, ReactNode, startTransition } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [renderPath, setRenderPath] = useState(pathname);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (pathname !== renderPath) {
      setIsPending(true);
      const timer = setTimeout(() => {
        startTransition(() => {
          setDisplayChildren(children);
          setRenderPath(pathname);
        });
        const innerTimer = setTimeout(() => {
          setIsPending(false);
        }, 100);
        return () => clearTimeout(innerTimer);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children, renderPath]);

  return (
    <div className={`page-transition-wrapper ${isPending ? "page-leave" : "page-enter"}`}>
      <div className={`loading-bar ${isPending ? "loading" : ""}`} />
      {displayChildren}
    </div>
  );
}
