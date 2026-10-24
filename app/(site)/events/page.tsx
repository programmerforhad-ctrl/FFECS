import type { Metadata } from "next";
import { getEvents } from "@/lib/data";
import { Empty, EventCard, PageHeader, SectionTitle } from "@/components/ui";

export const revalidate = 30;
export const metadata: Metadata = { title: "Events" };

export default async function Events() {
  const all = await getEvents();
  const cutoff = Date.now() - 86400000;
  const upcoming = all.filter((e) => new Date(e.event_date).getTime() >= cutoff);
  const past = all.filter((e) => new Date(e.event_date).getTime() < cutoff).reverse();

  return (
    <>
      <PageHeader title="Events" sub="Community meetups, practice sessions and more." />
      <div className="container-x py-12">
        <SectionTitle title="Upcoming" />
        {upcoming.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((e) => (
              <EventCard key={e.id} e={e} />
            ))}
          </div>
        ) : (
          <Empty text="No upcoming events right now." />
        )}

        {past.length > 0 && (
          <div className="mt-14">
            <SectionTitle title="Past events" />
            <div className="grid gap-4 opacity-80 md:grid-cols-2">
              {past.map((e) => (
                <EventCard key={e.id} e={e} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
