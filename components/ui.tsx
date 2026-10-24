import Link from "next/link";
import type { EventItem, Member, Tournament } from "@/lib/types";
import { dayParts, fmtDateTime } from "@/lib/format";
import { registerHref } from "@/lib/data";

export function SectionTitle({
  eyebrow,
  title,
  sub,
  center,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-8 ${center ? "text-center" : ""}`}>
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h2 className="text-3xl font-bold text-white sm:text-4xl">{title}</h2>
      {sub && <p className={`mt-2 max-w-2xl text-zinc-400 ${center ? "mx-auto" : ""}`}>{sub}</p>}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="card border-dashed px-6 py-10 text-center text-zinc-500">{text}</div>
  );
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <section className="border-b border-line" style={{ background: "radial-gradient(ellipse at top, rgba(255,77,26,0.18), transparent 65%)" }}>
      <div className="container-x py-14 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">{title}</h1>
        {sub && <p className="mx-auto mt-3 max-w-2xl text-zinc-400">{sub}</p>}
      </div>
    </section>
  );
}

const STATUS_STYLE: Record<string, string> = {
  upcoming: "border-brand2/40 bg-brand2/10 text-brand2",
  live: "border-red-500/50 bg-red-500/15 text-red-400",
  completed: "border-zinc-600 bg-zinc-800 text-zinc-400",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${STATUS_STYLE[status] ?? STATUS_STYLE.upcoming}`}
    >
      {status === "live" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />}
      {status}
    </span>
  );
}

export function TournamentCard({ t }: { t: Tournament }) {
  const href = registerHref(t);
  return (
    <article className="card flex flex-col overflow-hidden">
      {t.banner_url ? (
        <img src={t.banner_url} alt={t.title} className="h-48 w-full object-cover" />
      ) : (
        <div
          className="flex h-48 items-center justify-center font-display text-6xl font-bold text-brand/50"
          style={{ background: "linear-gradient(135deg, rgba(255,77,26,0.25), #13131a 60%)" }}
        >
          FF
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={t.status} />
          {t.start_date && <span className="text-xs text-zinc-400">{fmtDateTime(t.start_date)}</span>}
        </div>
        <h3 className="text-2xl font-bold text-white">{t.title}</h3>
        {t.description && <p className="whitespace-pre-line text-sm text-zinc-400">{t.description}</p>}

        {(t.entry_fee || t.prize_pool) && (
          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-bg/60 p-3 text-sm">
            {t.entry_fee && (
              <div>
                <dt className="text-xs uppercase tracking-wider text-zinc-500">Entry fee</dt>
                <dd className="font-semibold text-white">{t.entry_fee}</dd>
              </div>
            )}
            {t.prize_pool && (
              <div>
                <dt className="text-xs uppercase tracking-wider text-zinc-500">Prize pool</dt>
                <dd className="font-semibold text-brand2">{t.prize_pool}</dd>
              </div>
            )}
          </dl>
        )}

        {t.status === "completed" && (t.champion || t.result_summary) && (
          <div className="rounded-xl border border-brand2/30 bg-brand2/5 p-3 text-sm">
            {t.champion && (
              <p className="font-semibold text-brand2">🏆 Champion: <span className="text-white">{t.champion}</span></p>
            )}
            {t.result_summary && <p className="mt-1 whitespace-pre-line text-zinc-400">{t.result_summary}</p>}
          </div>
        )}

        {t.rules && (
          <details className="rounded-xl border border-line px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium text-zinc-200">Rules</summary>
            <p className="mt-2 whitespace-pre-line text-zinc-400">{t.rules}</p>
          </details>
        )}

        {href && (
          <div className="mt-auto pt-2">
            <Link href={href} className="btn btn-primary w-full">
              Register Now
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}

export function EventCard({ e }: { e: EventItem }) {
  const { day, month } = dayParts(e.event_date);
  return (
    <article className="card flex gap-4 overflow-hidden p-4">
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand2 text-black">
        <span className="font-display text-2xl font-bold leading-none">{day}</span>
        <span className="text-xs font-semibold uppercase">{month}</span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-xl font-bold text-white">{e.title}</h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          {fmtDateTime(e.event_date)}
          {e.location ? ` · ${e.location}` : ""}
        </p>
        {e.description && <p className="mt-2 whitespace-pre-line text-sm text-zinc-400">{e.description}</p>}
        {e.image_url && <img src={e.image_url} alt={e.title} className="mt-3 max-h-48 w-full rounded-lg object-cover" />}
      </div>
    </article>
  );
}

export function MemberCard({ m }: { m: Member }) {
  const initials = m.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <article className="card flex flex-col items-center p-6 text-center transition hover:border-brand/50">
      {m.photo_url ? (
        <img src={m.photo_url} alt={m.name} className="h-28 w-28 rounded-full border-2 border-brand/60 object-cover" />
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-brand/60 bg-bg font-display text-3xl font-bold text-brand">
          {initials}
        </div>
      )}
      <h3 className="mt-4 text-xl font-bold text-white">{m.name}</h3>
      <p className="mt-1 rounded-full bg-brand/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand">
        {m.position}
      </p>
      {m.bio && <p className="mt-3 text-sm text-zinc-400">{m.bio}</p>}
      {m.facebook_url && (
        <a href={m.facebook_url} target="_blank" rel="noopener noreferrer" className="mt-3 text-sm text-zinc-400 hover:text-brand">
          Facebook ↗
        </a>
      )}
    </article>
  );
}
