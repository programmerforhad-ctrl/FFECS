"use client";

import { useEffect, useRef, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const two = (n: number) => String(n).padStart(2, "0");

/**
 * Live countdown to `target` (ISO string).
 * `offsetMs` = server time minus this device's time, so a wrong phone clock cannot show the wrong time.
 */
export function useRemaining(target: string, offsetMs = 0, onZero?: () => void) {
  const [left, setLeft] = useState<number | null>(null);
  const fired = useRef(false);
  const cb = useRef(onZero);
  cb.current = onZero;

  useEffect(() => {
    fired.current = false;
    const t = new Date(target).getTime();
    const tick = () => {
      const l = t - (Date.now() + offsetMs);
      setLeft(l);
      if (l <= 0 && !fired.current) {
        fired.current = true;
        cb.current?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target, offsetMs]);

  return left;
}

export function Countdown({
  target,
  offsetMs = 0,
  onZero,
  size = "md",
}: {
  target: string;
  offsetMs?: number;
  onZero?: () => void;
  size?: "md" | "lg";
}) {
  const left = useRemaining(target, offsetMs, onZero);
  const p = parts(left ?? 0);
  const items: [string, number][] = [
    ["days", p.d],
    ["hours", p.h],
    ["min", p.m],
    ["sec", p.s],
  ];
  const num = size === "lg" ? "text-5xl sm:text-6xl" : "text-3xl";

  return (
    <div className="flex items-end gap-3 sm:gap-4" role="timer" aria-live="off">
      {items.map(([label, v], i) => (
        <div key={label} className="flex items-end gap-3 sm:gap-4">
          <div className="text-center">
            <div className={`num font-display font-black leading-none text-white ${num}`}>
              <span key={left === null ? "x" : v} className={label === "sec" && left !== null ? "tick inline-block" : "inline-block"}>
                {left === null ? "--" : two(v)}
              </span>
            </div>
            <div className="mt-1 text-xs text-zinc-400">{label}</div>
          </div>
          {i < items.length - 1 && <span className="pb-5 font-display text-2xl font-bold text-brand/70">:</span>}
        </div>
      ))}
    </div>
  );
}

/** "2d 4h 10m" style text, ticking once per second. */
export function CountdownText({ target, offsetMs = 0, onZero }: { target: string; offsetMs?: number; onZero?: () => void }) {
  const left = useRemaining(target, offsetMs, onZero);
  if (left === null) return <span className="num">--</span>;
  const p = parts(left);
  const txt = p.d > 0 ? `${p.d}d ${p.h}h ${two(p.m)}m` : p.h > 0 ? `${p.h}h ${two(p.m)}m ${two(p.s)}s` : `${two(p.m)}m ${two(p.s)}s`;
  return <span className="num">{txt}</span>;
}
