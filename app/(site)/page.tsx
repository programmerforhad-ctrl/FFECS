import Link from "next/link";
import { getEvents, getSettings, getTournaments, registerHref } from "@/lib/data";
import { DEFAULT_NAME } from "@/lib/settings";
import { EventCard, Empty, SectionTitle, TournamentCard } from "@/components/ui";

export const revalidate = 30;

export default async function Home() {
  const [s, tournaments, events] = await Promise.all([getSettings(), getTournaments(), getEvents()]);
  const name = s.community_name || DEFAULT_NAME;

  const upcomingT = tournaments
    .filter((t) => t.status !== "completed")
    .sort((a, b) => (a.start_date ?? "9").localeCompare(b.start_date ?? "9"));
  const latestDone = tournaments.find((t) => t.status === "completed");
  const nextT = upcomingT[0];
  const nextHref = registerHref(nextT);
  const upcomingEvents = events.filter((e) => new Date(e.event_date) >= new Date(Date.now() - 86400000)).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-line"
        style={{
          backgroundImage: s.hero_image_url
            ? `linear-gradient(rgba(8,8,12,.78), rgba(8,8,12,.95)), url(${s.hero_image_url})`
            : "radial-gradient(ellipse at 50% 0%, rgba(255,77,26,0.28), transparent 60%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container-x py-20 text-center sm:py-28">
          <p className="eyebrow mb-4">Free Fire · Sylhet · Bangladesh</p>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-white sm:text-6xl">{name}</h1>
          {s.tagline && <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-300">{s.tagline}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {nextHref ? (
              <Link href={nextHref} className="btn btn-primary px-7 py-3 text-base">
                Register for {nextT?.title}
              </Link>
            ) : (
              <Link href="/tournaments" className="btn btn-primary px-7 py-3 text-base">
                View Tournaments
              </Link>
            )}
            <Link href="/about" className="btn btn-ghost px-7 py-3 text-base">
              About Us
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming tournaments */}
      <section className="container-x pt-16">
        <SectionTitle eyebrow="Compete" title="Upcoming Tournaments" />
        {upcomingT.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingT.slice(0, 3).map((t) => (
              <TournamentCard key={t.id} t={t} />
            ))}
          </div>
        ) : (
          <Empty text="No upcoming tournament right now. Stay tuned!" />
        )}
      </section>

      {/* Upcoming events */}
      <section className="container-x pt-16">
        <div className="flex items-end justify-between">
          <SectionTitle eyebrow="Don't miss" title="Upcoming Events" />
          <Link href="/events" className="mb-8 text-sm text-brand hover:underline">
            All events →
          </Link>
        </div>
        {upcomingEvents.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingEvents.map((e) => (
              <EventCard key={e.id} e={e} />
            ))}
          </div>
        ) : (
          <Empty text="No upcoming events right now." />
        )}
      </section>

      {/* Latest tournament result */}
      {latestDone && (
        <section className="container-x pt-16">
          <SectionTitle eyebrow="Results" title="Latest Tournament" />
          <div className="max-w-xl">
            <TournamentCard t={latestDone} />
          </div>
        </section>
      )}

      {/* About teaser */}
      {s.about_text && (
        <section className="container-x pt-16">
          <div className="card p-8 sm:p-10">
            <p className="eyebrow mb-2">Who we are</p>
            <h2 className="text-3xl font-bold text-white">About Us</h2>
            <p className="mt-4 line-clamp-4 max-w-3xl whitespace-pre-line text-zinc-400">{s.about_text}</p>
            <Link href="/about" className="btn btn-ghost mt-6">
              Read more
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
