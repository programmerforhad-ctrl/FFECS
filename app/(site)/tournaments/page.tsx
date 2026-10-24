import type { Metadata } from "next";
import { getTournaments } from "@/lib/data";
import { Empty, PageHeader, SectionTitle, TournamentCard } from "@/components/ui";

export const revalidate = 30;
export const metadata: Metadata = { title: "Tournaments" };

export default async function Tournaments() {
  const all = await getTournaments();
  const active = all.filter((t) => t.status !== "completed");
  const done = all.filter((t) => t.status === "completed");

  return (
    <>
      <PageHeader title="Tournaments" sub="Register for upcoming tournaments and see past results." />
      <div className="container-x py-12">
        <SectionTitle title="Upcoming & Live" />
        {active.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {active.map((t) => (
              <TournamentCard key={t.id} t={t} />
            ))}
          </div>
        ) : (
          <Empty text="No upcoming tournament right now. Stay tuned!" />
        )}

        <div className="mt-14">
          <SectionTitle title="Past tournaments" />
          {done.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {done.map((t) => (
                <TournamentCard key={t.id} t={t} />
              ))}
            </div>
          ) : (
            <Empty text="No completed tournaments yet." />
          )}
        </div>
      </div>
    </>
  );
}
