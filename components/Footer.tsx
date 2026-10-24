import Link from "next/link";

export default function Footer({ s, name }: { s: Record<string, string>; name: string }) {
  const socials = [
    ["Facebook Page", s.facebook_page],
    ["Facebook Group", s.facebook_group],
    ["Discord", s.discord],
    ["YouTube", s.youtube],
    ["Instagram", s.instagram],
  ].filter(([, url]) => url);

  return (
    <footer className="mt-20 border-t border-line bg-panel/50">
      <div className="container-x grid gap-8 py-10 md:grid-cols-3">
        <div>
          <h3 className="text-xl font-bold text-white">{name}</h3>
          {s.tagline && <p className="mt-2 text-sm text-zinc-400">{s.tagline}</p>}
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Quick links</h4>
          <ul className="space-y-2 text-sm">
            {[
              ["/about", "About"],
              ["/management", "Management"],
              ["/events", "Events"],
              ["/tournaments", "Tournaments"],
              ["/contact", "Contact"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-zinc-300 hover:text-brand">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Follow us</h4>
          {socials.length ? (
            <ul className="space-y-2 text-sm">
              {socials.map(([label, url]) => (
                <li key={label}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-brand">
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
      <div className="border-t border-line py-4 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} {name}. All rights reserved.
      </div>
    </footer>
  );
}
