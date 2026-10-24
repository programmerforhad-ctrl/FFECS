import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { PageHeader } from "@/components/ui";

export const revalidate = 30;
export const metadata: Metadata = { title: "About Us" };

export default async function About() {
  const s = await getSettings();
  const blocks = [
    ["Mission", s.mission],
    ["Vision", s.vision],
  ].filter(([, v]) => v);

  return (
    <>
      <PageHeader title="About Us" sub={s.founded ? `Since ${s.founded}` : undefined} />
      <div className="container-x max-w-4xl py-12">
        {s.about_text ? (
          <p className="whitespace-pre-line text-lg leading-relaxed text-zinc-300">{s.about_text}</p>
        ) : (
          <p className="text-zinc-500">About information will be added soon.</p>
        )}
        {blocks.length > 0 && (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {blocks.map(([title, text]) => (
              <div key={title} className="card p-6">
                <h2 className="text-2xl font-bold text-brand">{title}</h2>
                <p className="mt-3 whitespace-pre-line text-zinc-400">{text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
