"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          {logo ? (
            <img src={logo} alt="" className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand2 font-display text-lg font-bold text-black">
              FF
            </span>
          )}
          <span className="truncate font-display text-base font-bold tracking-wide text-white sm:text-lg">{name}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                active(href) ? "bg-brand/15 text-brand" : "text-zinc-300 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <button
          className="btn btn-ghost btn-sm lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-bg lg:hidden">
          <div className="container-x flex flex-col py-2">
            {LINKS.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-3 text-sm font-medium ${
                  active(href) ? "text-brand" : "text-zinc-300"
                }`}
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
