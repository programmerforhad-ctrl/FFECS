import type { Metadata } from "next";
import PortalClient from "@/components/portal/PortalClient";

export const metadata: Metadata = { title: "Team portal", robots: { index: false, follow: false } };

export default function PortalPage() {
  return <PortalClient />;
}
