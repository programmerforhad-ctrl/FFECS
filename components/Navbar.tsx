"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  ["/", "Home"],
  ["/about", "About"],
  ["/management", "Management"],
  ["/events", "Events"],
  ["/tournaments", "Tournaments"],
  ["/contact", "Contact"],
] as const;

export default function Navbar({ name, logo }: { name: string; logo?: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${
        scrolled ? "border-line bg-bg/85" : "border-transparent bg-bg/30"
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          {logo ? (
            <img src={logo} alt="" className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand2 font-display text-lg font-black text-[#061512]">
              FF
            </span>
          )}
          <span className="hidden truncate font-display text-lg font-extrabold leading-none text-white sm:block">{name}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`group relative px-3 py-2 text-sm font-semibold transition ${
                active(href) ? "text-white" : "text-zinc-300 hover:text-white"
              }`}
            >
              {label}
              <span
                className={`absolute inset-x-3 -bottom-px h-0.5 origin-left rounded bg-brand transition-transform duration-300 ${
                  active(href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                }`}
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/portal" className="btn btn-primary btn-sm">
            Team login
          </Link>
          <button
            className="btn btn-ghost btn-sm lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <nav className="anim-fade-up border-t border-line bg-bg lg:hidden">
          <div className="container-x flex flex-col py-2">
            {LINKS.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-3 text-sm font-semibold ${active(href) ? "text-brand" : "text-zinc-300"}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
