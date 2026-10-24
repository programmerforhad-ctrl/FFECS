"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { EventItem } from "@/lib/types";
import { fmtDateTime, fromLocalInput, toLocalInput } from "@/lib/format";
import ImageUpload from "@/components/admin/ImageUpload";

type Draft = Partial<EventItem> & { date_input?: string };
const blank: Draft = { title: "", description: "", location: "", image_url: "", is_published: true, date_input: "" };

export default function EventsAdmin() {
  const [list, setList] = useState<EventItem[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: false });
    setList((data ?? []) as EventItem[]);
  };
  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!draft?.title?.trim() || !draft.date_input) return setErr("Title and date/time are required.");
    setErr("");
    setBusy(true);
    const row = {
      title: draft.title.trim(),
      description: draft.description || null,
      location: draft.location || null,
      image_url: draft.image_url || null,
      is_published: draft.is_published ?? true,
      event_date: fromLocalInput(draft.date_input),
    };
    const { error } = draft.id
      ? await supabase.from("events").update(row).eq("id", draft.id)
      : await supabase.from("events").insert(row);
    setBusy(false);
    if (error) return setErr(error.message);
    setDraft(null);
    load();
  }

  async function remove(e: EventItem) {
    if (!confirm(`Delete "${e.title}"?`)) return;
    await supabase.from("events").delete().eq("id", e.id);
    load();
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Events</h1>
        <button className="btn btn-primary" onClick={() => setDraft({ ...blank })}>
          + Add event
        </button>
      </div>

      {draft && (
        <div className="card mt-6 space-y-4 p-5">
          <h2 className="text-xl font-bold text-brand">{draft.id ? "Edit event" : "New event"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Title *</label>
              <input className="input" value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Date & time * (Bangladesh time)</label>
              <input type="datetime-local" className="input" value={draft.date_input ?? ""} onChange={(e) => setDraft({ ...draft, date_input: e.target.value })} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={draft.location ?? ""} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={4} className="input" value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Image</label>
            <ImageUpload folder="events" value={draft.image_url} onChange={(u) => setDraft({ ...draft, image_url: u })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-200">
            <input type="checkbox" className="h-4 w-4 accent-[#ff4d1a]" checked={draft.is_published ?? true} onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })} />
            Published (visible on website)
          </label>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={busy} onClick={save}>
              {busy ? "Saving…" : "Save"}
            </button>
            <button className="btn btn-ghost" onClick={() => { setDraft(null); setErr(""); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {list.length === 0 && <p className="text-zinc-500">No events yet.</p>}
        {list.map((e) => (
          <div key={e.id} className="card flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-white">
                {e.title} {!e.is_published && <span className="ml-2 rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">hidden</span>}
              </p>
              <p className="text-sm text-zinc-400">{fmtDateTime(e.event_date)}</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setDraft({ ...e, date_input: toLocalInput(e.event_date) }); setErr(""); }}>
              Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => remove(e)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
