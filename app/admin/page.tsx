"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const TABLES = [
  ["management_members", "Management members", "/admin/members"],
  ["events", "Events", "/admin/events"],
  ["tournaments", "Tournaments", "/admin/tournaments"],
  ["forms", "Forms", "/admin/forms"],
  ["form_responses", "Total responses", "/admin/forms"],
] as const;

export default function Dashboard() {
  const [counts, setCounts] = useState<Record<string, number | null>>({});

  useEffect(() => {
    TABLES.forEach(async ([t]) => {
      const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
      setCounts((c) => ({ ...c, [t]: count ?? 0 }));
    });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>
      <p className="mt-1 text-zinc-400">Control everything on the website from here.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TABLES.map(([t, label, href]) => (
          <Link key={t} href={href} className="card p-5 transition hover:border-brand/60">
            <p className="text-sm text-zinc-400">{label}</p>
            <p className="mt-1 font-display text-4xl font-bold text-white">{counts[t] ?? "…"}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
