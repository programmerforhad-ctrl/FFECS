import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { PageHeader } from "@/components/ui";

export const revalidate = 30;
export const metadata: Metadata = { title: "Contact" };

export default async function Contact() {
  const s = await getSettings();
  const wa = (s.whatsapp || "").replace(/\D/g, "");

  const items: [string, string, string | undefined][] = [
    ["Email", s.email, s.email ? `mailto:${s.email}` : undefined],
    ["Phone", s.phone, s.phone ? `tel:${s.phone.replace(/\s/g, "")}` : undefined],
    ["WhatsApp", s.whatsapp, wa ? `https://wa.me/${wa}` : undefined],
    ["Address", s.address, undefined],
    ["Facebook Page", s.facebook_page, s.facebook_page],
    ["Facebook Group", s.facebook_group, s.facebook_group],
    ["Discord", s.discord, s.discord],
    ["YouTube", s.youtube, s.youtube],
    ["Instagram", s.instagram, s.instagram],
  ];
  const shown = items.filter(([, v]) => v);

  return (
    <>
      <PageHeader title="Contact Us" sub="Reach out to the management team." />
      <div className="container-x max-w-4xl py-12">
        {shown.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {shown.map(([label, value, href]) => {
              const inner = (
                <>
                  <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
                  <p className="mt-1 break-words font-semibold text-white">{value}</p>
                </>
              );
              return href ? (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="card p-5 transition hover:border-brand/60"
                >
                  {inner}
                </a>
              ) : (
                <div key={label} className="card p-5">
                  {inner}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-zinc-500">Contact details will be added soon.</p>
        )}
      </div>
    </>
  );
}
