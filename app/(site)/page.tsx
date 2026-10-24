import Link from "next/link";
import { getEvents, getSettings, getStats, getTournaments, registerHref } from "@/lib/data";
import { DEFAULT_NAME } from "@/lib/settings";
import { fmtDate } from "@/lib/format";
import { EventCard, Empty, SectionTitle, TournamentCard } from "@/components/ui";
import HeroTicket from "@/components/HeroTicket";
import Contours from "@/components/Contours";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";

export const revalidate = 30;

function headlineLines(name: string): string[] {
  const w = name.trim().split(/\s+/);
  if (w.length >= 4) return [w.slice(0, 2).join(" "), w.slice(2, -1).join(" "), w[w.length - 1]];
  if (w.length === 3) return [w[0], w[1], w[2]];
  return [name];
}

export default async function Home() {
  const [s, tournaments, events, stats] = await Promise.all([getSettings(), getTournaments(), getEvents(), getStats()]);
  const name = s.community_name || DEFAULT_NAME;
  const now = Date.now();

  const upcomingT = tournaments
    .filter((t) => t.status !== "completed")
    .sort((a, b) => (a.start_date ?? "9").localeCompare(b.start_date ?? "9"));
  const latestDone = tournaments.find((t) => t.status === "completed");
  const nextT = upcomingT[0];
  const nextHref = registerHref(nextT);
  const regOpen = !!nextHref && (!nextT?.registration_end || new Date(nextT.registration_end).getTime() > now);
  const upcomingEvents = events.filter((e) => new Date(e.event_date).getTime() >= now - 86400000).slice(0, 4);

  const ticker: string[] = [];
  upcomingT.slice(0, 3).forEach((t) => ticker.push(`${t.title}: ${t.status === "live" ? "live now" : t.start_date ? fmtDate(t.start_date) : "date soon"}`));
  upcomingEvents.slice(0, 2).forEach((e) => ticker.push(`${e.title}: ${fmtDate(e.event_date)}`));
  if (stats.teams > 0) ticker.push(`${stats.teams} teams registered so far`);

  const statItems: [number, string][] = (
    [
      [stats.teams, "teams registered"],
      [stats.tournaments, "tournaments"],
      [stats.events, "events"],
      [stats.members, "management members"],
    ] as [number, string][]
  ).filter(([n]) => n > 0);

  const lines = headlineLines(name);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        {s.hero_image_url && (
          <div
            className="absolute inset-0 opacity-25"
            style={{ backgroundImage: `url(${s.hero_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        )}
        <Contours className="pointer-events-none absolute -left-40 -top-40 h-[160%] w-[90%] text-brand/[0.12]" rings={18} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg" />

        <div className="container-x relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
          <div>
            <p className="anim-fade-up mb-5 text-base font-semibold text-brand" style={{ animationDelay: "0.1s" }}>
              Free Fire e-sports in Sylhet
            </p>
            <h1 className="text-[3.4rem] leading-[0.92] text-white sm:text-[6rem] lg:text-[7rem]">
              {lines.map((l, i) => (
                <span key={l} className="word-mask">
                  <span style={{ animationDelay: `${0.15 + i * 0.12}s` }}>{l}</span>
                </span>
              ))}
            </h1>
            {s.tagline && (
              <p className="anim-fade-up mt-7 max-w-lg text-lg text-zinc-300" style={{ animationDelay: "0.6s" }}>
                {s.tagline}
              </p>
            )}
            <div className="anim-fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.75s" }}>
              {regOpen && nextHref ? (
                <Link href={nextHref} className="btn btn-primary px-7 py-3 text-base">
                  Register for {nextT?.title}
                </Link>
              ) : (
                <Link href="/tournaments" className="btn btn-primary px-7 py-3 text-base">
                  See tournaments
                </Link>
              )}
              <Link href="/portal" className="btn btn-ghost px-7 py-3 text-base">
                Team login
              </Link>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroTicket t={nextT} />
          </div>
        </div>
      </section>

      {/* Ticker */}
      {ticker.length > 0 && (
        <div className="marquee overflow-hidden border-b border-line bg-panel/70 py-3">
          <div className="marquee-track">
            {[0, 1].map((k) => (
              <div key={k} className="flex shrink-0 items-center" aria-hidden={k === 1}>
                {ticker.map((t, i) => (
                  <span key={`${k}-${i}`} className="flex items-center whitespace-nowrap text-sm font-semibold text-zinc-300">
                    <span className="mx-6 inline-block h-2 w-2 rotate-45 bg-brand" />
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Numbers */}
      {statItems.length > 0 && (
        <Reveal>
          <section className="container-x pt-14">
            <dl className="grid grid-cols-2 gap-y-8 border-y border-line py-8 sm:grid-cols-4">
              {statItems.map(([n, label], i) => (
                <div key={label} className={`px-4 ${i > 0 ? "sm:border-l sm:border-line" : ""}`}>
                  <dd className="font-display text-6xl font-black leading-none text-white">
                    <CountUp value={n} />
                  </dd>
                  <dt className="mt-1 text-sm text-zinc-400">{label}</dt>
                </div>
              ))}
            </dl>
          </section>
        </Reveal>
      )}

      {/* Upcoming tournaments */}
      <section className="container-x pt-20">
        <Reveal>
          <SectionTitle title="Upcoming tournaments" sub="Pick one, register your squad, and wait for the selection result." />
        </Reveal>
        {upcomingT.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingT.slice(0, 3).map((t, i) => (
              <Reveal key={t.id} delay={i * 90}>
                <TournamentCard t={t} />
              </Reveal>
            ))}
          </div>
        ) : (
          <Empty text="No upcoming tournament right now. Stay tuned!" />
        )}
      </section>

      {/* Events */}
      <section className="container-x pt-20">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <SectionTitle title="Upcoming events" />
            <Link href="/events" className="mb-8 text-sm font-semibold text-brand hover:underline">
              All events
            </Link>
          </div>
        </Reveal>
        {upcomingEvents.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingEvents.map((e, i) => (
              <Reveal key={e.id} delay={i * 70}>
                <EventCard e={e} />
              </Reveal>
            ))}
          </div>
        ) : (
          <Empty text="No upcoming events right now." />
        )}
      </section>

      {/* Latest result */}
      {latestDone && (
        <section className="container-x pt-20">
          <Reveal>
            <SectionTitle title="Latest tournament result" />
            <div className="max-w-xl">
              <TournamentCard t={latestDone} />
            </div>
          </Reveal>
        </section>
      )}

      {/* About */}
      {s.about_text && (
        <section className="container-x pt-20">
          <Reveal>
            <div className="card relative overflow-hidden p-8 sm:p-12">
              <Contours className="pointer-events-none absolute -right-24 -top-24 h-[160%] w-[60%] text-brand/[0.08]" rings={10} />
              <h2 className="relative text-4xl text-white sm:text-5xl">About us</h2>
              <p className="relative mt-4 line-clamp-4 max-w-2xl whitespace-pre-line text-zinc-300">{s.about_text}</p>
              <Link href="/about" className="btn btn-ghost relative mt-6">
                Read more
              </Link>
            </div>
          </Reveal>
        </section>
      )}
    </>
  );
}
