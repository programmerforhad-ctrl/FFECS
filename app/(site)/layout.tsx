import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSettings } from "@/lib/data";
import { DEFAULT_NAME } from "@/lib/settings";

export const revalidate = 30;

export async function generateMetadata() {
  const s = await getSettings();
  const name = s.community_name || DEFAULT_NAME;
  return {
    title: { default: name, template: `%s | ${name}` },
    description: s.tagline || "Official website of Free Fire E-Sports Community Sylhet.",
    openGraph: { title: name, description: s.tagline || undefined, images: s.hero_image_url ? [s.hero_image_url] : undefined },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const name = s.community_name || DEFAULT_NAME;
  return (
    <>
      <Navbar name={name} logo={s.logo_url || undefined} />
      <main className="min-h-[70vh]">{children}</main>
      <Footer s={s} name={name} />
    </>
  );
}
