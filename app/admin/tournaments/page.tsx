"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Form, Tournament } from "@/lib/types";
import { fmtDateTime, fromLocalInput, toLocalInput } from "@/lib/format";
import ImageUpload from "@/components/admin/ImageUpload";
import { StatusBadge } from "@/components/ui";

type Draft = Partial<Tournament> & { date_input?: string; reg_input?: string };
const blank: Draft = {
  title: "",
  description: "",
  status: "upcoming",
  entry_fee: "",
  prize_pool: "",
  rules: "",
  banner_url: "",
  champion: "",
  result_summary: "",
  form_id: null,
  is_published: true,
  date_input: "",
  reg_input: "",
};

export default function TournamentsAdmin() {
  const [list, setList] = useState<Tournament[]>([]);
  const [forms, setForms] = useState<Pick<Form, "id" | "title" | "slug">[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    const [t, f] = await Promise.all([
      supabase.from("tournaments").select("*").order("created_at", { ascending: false }),
      supabase.from("forms").select("id,title,slug").order("created_at", { ascending: false }),
    ]);
    setList((t.data ?? []) as Tournament[]);
    setForms(f.data ?? []);
  };
  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!draft?.title?.trim()) return setErr("Title is required.");
    setErr("");
    setBusy(true);
    const row = {
      title: draft.title.trim(),
      description: draft.description || null,
      status: draft.status ?? "upcoming",
      start_date: fromLocalInput(draft.date_input),
      registration_end: fromLocalInput(draft.reg_input),
      entry_fee: draft.entry_fee || null,
      prize_pool: draft.prize_pool || null,
      rules: draft.rules || null,
      banner_url: draft.banner_url || null,
      champion: draft.champion || null,
      result_summary: draft.result_summary || null,
      form_id: draft.form_id || null,
      is_published: draft.is_published ?? true,
    };
    const { error } = draft.id
      ? await supabase.from("tournaments").update(row).eq("id", draft.id)
      : await supabase.from("tournaments").insert(row);
    setBusy(false);
    if (error) return setErr(error.message);
    setDraft(null);
    load();
  }

  async function remove(t: Tournament) {
    if (!confirm(`Delete "${t.title}"?`)) return;
    await supabase.from("tournaments").delete().eq("id", t.id);
    load();
  }

  const d = draft;
  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Tournaments</h1>
        <button className="btn btn-primary" onClick={() => setDraft({ ...blank })}>
          + Add tournament
        </button>
      </div>

      {d && (
        <div className="card mt-6 space-y-4 p-5">
          <h2 className="text-xl font-bold text-brand">{d.id ? "Edit tournament" : "New tournament"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Title *</label>
              <input className="input" value={d.title ?? ""} onChange={(e) => setDraft({ ...d, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={d.status} onChange={(e) => setDraft({ ...d, status: e.target.value as Tournament["status"] })}>
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="label">Start date & time (Bangladesh time)</label>
              <input type="datetime-local" className="input" value={d.date_input ?? ""} onChange={(e) => setDraft({ ...d, date_input: e.target.value })} />
            </div>
            <div>
              <label className="label">Registration ends (Bangladesh time)</label>
              <input type="datetime-local" className="input" value={d.reg_input ?? ""} onChange={(e) => setDraft({ ...d, reg_input: e.target.value })} />
              <p className="mt-1 text-xs text-zinc-500">The registration form closes automatically at this time.</p>
            </div>
            <div>
              <label className="label">Entry fee (e.g. 100 BDT / Free)</label>
              <input className="input" value={d.entry_fee ?? ""} onChange={(e) => setDraft({ ...d, entry_fee: e.target.value })} />
            </div>
            <div>
              <label className="label">Prize pool</label>
              <input className="input" value={d.prize_pool ?? ""} onChange={(e) => setDraft({ ...d, prize_pool: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Registration form (shows the "Register Now" button)</label>
              <select className="input" value={d.form_id ?? ""} onChange={(e) => setDraft({ ...d, form_id: e.target.value || null })}>
                <option value="">— none —</option>
                {forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title} (/form/{f.slug})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={3} className="input" value={d.description ?? ""} onChange={(e) => setDraft({ ...d, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Rules</label>
            <textarea rows={4} className="input" value={d.rules ?? ""} onChange={(e) => setDraft({ ...d, rules: e.target.value })} />
          </div>
          <div>
            <label className="label">Banner image</label>
            <ImageUpload folder="tournaments" value={d.banner_url} onChange={(u) => setDraft({ ...d, banner_url: u })} />
          </div>
          <div className="grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2">
            <p className="text-xs text-zinc-500 sm:col-span-2">Result (fill after the tournament ends, set status to Completed)</p>
            <div>
              <label className="label">Champion team</label>
              <input className="input" value={d.champion ?? ""} onChange={(e) => setDraft({ ...d, champion: e.target.value })} />
            </div>
            <div>
              <label className="label">Result summary</label>
              <textarea rows={2} className="input" value={d.result_summary ?? ""} onChange={(e) => setDraft({ ...d, result_summary: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-200">
            <input type="checkbox" className="h-4 w-4 accent-[#ff7a29]" checked={d.is_published ?? true} onChange={(e) => setDraft({ ...d, is_published: e.target.checked })} />
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
        {list.length === 0 && <p className="text-zinc-500">No tournaments yet.</p>}
        {list.map((t) => (
          <div key={t.id} className="card flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-white">
                {t.title} {!t.is_published && <span className="ml-2 rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">hidden</span>}
              </p>
              <p className="text-sm text-zinc-400">{t.start_date ? fmtDateTime(t.start_date) : "No date set"}</p>
            </div>
            <StatusBadge status={t.status} />
            <Link href={`/admin/tournaments/${t.id}`} className="btn btn-primary btn-sm">
              Teams & matches
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={() => { setDraft({ ...t, date_input: toLocalInput(t.start_date), reg_input: toLocalInput(t.registration_end) }); setErr(""); }}>
              Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => remove(t)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
