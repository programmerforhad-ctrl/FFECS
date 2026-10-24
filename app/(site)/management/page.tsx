import type { Metadata } from "next";
import { getMembers } from "@/lib/data";
import { Empty, MemberCard, PageHeader } from "@/components/ui";

export const revalidate = 30;
export const metadata: Metadata = { title: "Management" };

export default async function Management() {
  const members = await getMembers();
  return (
    <>
      <PageHeader title="Management" sub="The people who run the community." />
      <div className="container-x py-12">
        {members.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => (
              <MemberCard key={m.id} m={m} />
            ))}
          </div>
        ) : (
          <Empty text="Management members will be added soon." />
        )}
      </div>
    </>
  );
}
