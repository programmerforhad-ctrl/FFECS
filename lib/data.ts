import { supabase } from "./supabase";
import type { EventItem, Member, Tournament } from "./types";

// Public-site fetchers. They never throw: on any failure the page just renders empty.
async function safe<T>(fn: () => PromiseLike<{ data: any; error: any }>, fallback: T): Promise<T> {
  try {
    const { data, error } = await fn();
    if (error || !data) return fallback;
    return data as T;
  } catch {
    return fallback;
  }
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await safe<{ key: string; value: string }[]>(
    () => supabase.from("site_settings").select("key,value"),
    []
  );
  return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
}

export const getMembers = () =>
  safe<Member[]>(
    () =>
      supabase
        .from("management_members")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    []
  );

export const getEvents = () =>
  safe<EventItem[]>(
    () =>
      supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .order("event_date", { ascending: true }),
    []
  );

export const getTournaments = () =>
  safe<Tournament[]>(
    () =>
      supabase
        .from("tournaments")
        .select("*, forms(slug,is_open)")
        .eq("is_published", true)
        .order("start_date", { ascending: false, nullsFirst: false }),
    []
  );

export function registerHref(t?: Tournament | null): string | null {
  if (!t || t.status === "completed") return null;
  if (t.forms?.slug && t.forms.is_open) return `/form/${t.forms.slug}`;
  return null;
}

export type Stats = { teams: number; tournaments: number; events: number; members: number };

export async function getStats(): Promise<Stats> {
  const empty = { teams: 0, tournaments: 0, events: 0, members: 0 };
  try {
    const { data, error } = await supabase.rpc("public_stats");
    if (error || !data) return empty;
    return { ...empty, ...(data as Partial<Stats>) };
  } catch {
    return empty;
  }
}
