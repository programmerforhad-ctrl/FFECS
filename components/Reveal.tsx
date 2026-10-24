"use client";

import { useEffect, useRef, useState } from "react";

// Fades a block in once as it scrolls into view. Content is fully visible until the page has loaded in the browser,
// and anything already on screen is never hidden, so nothing flickers or goes missing.
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "show">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95 || typeof IntersectionObserver === "undefined") {
      setState("show");
      return;
    }
    setState("hidden");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("show");
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cls = state === "hidden" ? "reveal-hidden" : state === "show" ? "reveal-show" : "";
  return (
    <div ref={ref} className={`${cls} ${className}`} style={state === "show" && delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}
