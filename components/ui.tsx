import type { EventItem, Member, Tournament } from "@/lib/types";
import { dayParts, fmtDateTime } from "@/lib/format";
import { registerHref } from "@/lib/data";
import Contours from "./Contours";
import RegisterButton from "./RegisterButton";

export function SectionTitle({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
      <h2 className="text-4xl text-white sm:text-5xl">{title}</h2>
      {sub && <p className="mt-3 max-w-2xl text-zinc-400">{sub}</p>}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="card border-dashed px-6 py-10 text-center text-zinc-500">{text}</div>;
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <Contours className="pointer-events-none absolute -right-32 -top-24 h-[220%] w-[75%] text-brand/[0.09]" rings={11} />
      <div className="container-x relative py-14 sm:py-20">
        <h1 className="word-mask text-5xl text-white sm:text-7xl">
          <span>{title}</span>
        </h1>
        {sub && (
          <p className="anim-fade-up mt-4 max-w-xl text-lg text-zinc-400" style={{ animationDelay: "0.35s" }}>
            {sub}
          </p>
        )}
        <div className="mt-6 h-1 w-24 rounded bg-gradient-to-r from-brand to-brand2" />
      </div>
    </section>
  );
}

const STATUS_STYLE: Record<string, string> = {
  upcoming: "border-brand2/40 bg-brand2/10 text-brand2",
  live: "border-brand/60 bg-brand/15 text-brand",
  completed: "border-zinc-600 bg-zinc-800 text-zinc-400",
  registered: "border-zinc-600 bg-zinc-800 text-zinc-300",
  selected: "border-leaf/50 bg-leaf/10 text-leaf",
  qualified: "border-brand2/60 bg-brand2/15 text-brand2",
  eliminated: "border-zinc-600 bg-zinc-800 text-zinc-400",
  disqualified: "border-red-400/50 bg-red-500/10 text-red-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold capitalize ${STATUS_STYLE[status] ?? STATUS_STYLE.upcoming}`}
    >
      {status === "live" && <span className="live-dot h-1.5 w-1.5 rounded-full bg-brand" />}
      {status}
    </span>
  );
}

export function TournamentCard({ t }: { t: Tournament }) {
  const href = registerHref(t);
  return (
    <article className="card card-lift flex h-full flex-col overflow-hidden">
      {t.banner_url ? (
        <img src={t.banner_url} alt={t.title} className="h-48 w-full object-cover" />
      ) : (
        <div className="relative flex h-48 items-end overflow-hidden bg-gradient-to-br from-brand/25 via-panel to-panel p-5">
          <Contours className="absolute inset-0 h-full w-full text-brand/20" rings={9} />
          <span className="relative font-display text-6xl font-black leading-none text-white/90">FF</span>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={t.status} />
          {t.start_date && <span className="text-xs text-zinc-400">{fmtDateTime(t.start_date)}</span>}
        </div>
        <h3 className="text-3xl text-white">{t.title}</h3>
        {t.description && <p className="whitespace-pre-line text-sm text-zinc-400">{t.description}</p>}

        {(t.entry_fee || t.prize_pool) && (
          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-bg/60 p-3 text-sm">
            {t.entry_fee && (
              <div>
                <dt className="text-xs text-zinc-500">Entry fee</dt>
                <dd className="font-bold text-white">{t.entry_fee}</dd>
              </div>
            )}
            {t.prize_pool && (
              <div>
                <dt className="text-xs text-zinc-500">Prize pool</dt>
                <dd className="font-bold text-brand2">{t.prize_pool}</dd>
              </div>
            )}
          </dl>
        )}

        {t.status !== "completed" && t.registration_end && (
          <p className="text-xs text-zinc-400">Registration ends {fmtDateTime(t.registration_end)}</p>
        )}

        {t.status === "completed" && (t.champion || t.result_summary) && (
          <div className="rounded-xl border border-brand2/30 bg-brand2/5 p-3 text-sm">
            {t.champion && (
              <p className="font-bold text-brand2">
                Champion: <span className="text-white">{t.champion}</span>
              </p>
            )}
            {t.result_summary && <p className="mt-1 whitespace-pre-line text-zinc-400">{t.result_summary}</p>}
          </div>
        )}

        {t.rules && (
          <details className="rounded-xl border border-line px-3 py-2 text-sm">
            <summary className="cursor-pointer font-semibold text-zinc-200">Rules</summary>
            <p className="mt-2 whitespace-pre-line text-zinc-400">{t.rules}</p>
          </details>
        )}

        {href && (
          <div className="mt-auto pt-2">
            <RegisterButton href={href} end={t.registration_end} />
          </div>
        )}
      </div>
    </article>
  );
}

export function EventCard({ e }: { e: EventItem }) {
  const { day, month } = dayParts(e.event_date);
  return (
    <article className="card card-lift flex gap-4 overflow-hidden p-4">
      <div className="flex h-[4.5rem] w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand2 text-[#061512]">
        <span className="font-display text-3xl font-black leading-none">{day}</span>
        <span className="text-xs font-bold">{month}</span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-2xl text-white">{e.title}</h3>
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
    <article className="card card-lift flex flex-col items-center p-6 text-center">
      {m.photo_url ? (
        <img src={m.photo_url} alt={m.name} className="h-28 w-28 rounded-full border-2 border-brand/70 object-cover" />
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-brand/70 bg-bg font-display text-4xl font-black text-brand">
          {initials}
        </div>
      )}
      <h3 className="mt-4 text-2xl text-white">{m.name}</h3>
      <p className="mt-1 rounded-full bg-brand/10 px-3 py-0.5 text-xs font-bold text-brand">{m.position}</p>
      {m.bio && <p className="mt-3 text-sm text-zinc-400">{m.bio}</p>}
      {m.facebook_url && (
        <a href={m.facebook_url} target="_blank" rel="noopener noreferrer" className="mt-3 text-sm text-zinc-400 transition hover:text-brand">
          Facebook ↗
        </a>
      )}
    </article>
  );
}
