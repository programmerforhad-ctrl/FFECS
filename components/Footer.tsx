import Link from "next/link";
import Contours from "./Contours";

export default function Footer({ s, name }: { s: Record<string, string>; name: string }) {
  const socials = [
    ["Facebook page", s.facebook_page],
    ["Facebook group", s.facebook_group],
    ["Discord", s.discord],
    ["YouTube", s.youtube],
    ["Instagram", s.instagram],
  ].filter(([, url]) => url);

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line bg-panel/60">
      <Contours className="pointer-events-none absolute -right-40 -top-20 h-[130%] w-[70%] text-brand/[0.07]" rings={12} />
      <div className="container-x relative grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <h3 className="max-w-sm text-3xl font-black text-white">{name}</h3>
          {s.tagline && <p className="mt-3 max-w-sm text-sm text-zinc-400">{s.tagline}</p>}
          <Link href="/portal" className="btn btn-ghost mt-5">
            Team login
          </Link>
        </div>
        <div>
          <h4 className="mb-3 text-lg font-bold text-white">Explore</h4>
          <ul className="space-y-2 text-sm">
            {[
              ["/about", "About"],
              ["/management", "Management"],
              ["/events", "Events"],
              ["/tournaments", "Tournaments"],
              ["/contact", "Contact"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-zinc-300 transition hover:text-brand">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-lg font-bold text-white">Follow us</h4>
          {socials.length ? (
            <ul className="space-y-2 text-sm">
              {socials.map(([label, url]) => (
                <li key={label}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-zinc-300 transition hover:text-brand">
                    {label} ↗
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Social links coming soon.</p>
          )}
        </div>
      </div>
      <div className="relative border-t border-line py-4 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} {name}
      </div>
    </footer>
  );
}
