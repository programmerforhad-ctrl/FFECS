"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Member } from "@/lib/types";
import ImageUpload from "@/components/admin/ImageUpload";

type Draft = Partial<Member>;
const blank: Draft = { name: "", position: "", bio: "", photo_url: "", facebook_url: "", sort_order: 0 };

export default function MembersAdmin() {
  const [list, setList] = useState<Member[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    const { data } = await supabase.from("management_members").select("*").order("sort_order").order("created_at");
    setList((data ?? []) as Member[]);
  };
  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!draft?.name?.trim() || !draft.position?.trim()) return setErr("Name and position are required.");
    setErr("");
    setBusy(true);
    const row = {
      name: draft.name.trim(),
      position: draft.position.trim(),
      bio: draft.bio || null,
      photo_url: draft.photo_url || null,
      facebook_url: draft.facebook_url || null,
      sort_order: Number(draft.sort_order) || 0,
    };
    const { error } = draft.id
      ? await supabase.from("management_members").update(row).eq("id", draft.id)
      : await supabase.from("management_members").insert(row);
    setBusy(false);
    if (error) return setErr(error.message);
    setDraft(null);
    load();
  }

  async function remove(m: Member) {
    if (!confirm(`Delete ${m.name}?`)) return;
    await supabase.from("management_members").delete().eq("id", m.id);
    load();
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Management Members</h1>
        <button className="btn btn-primary" onClick={() => setDraft({ ...blank, sort_order: list.length + 1 })}>
          + Add member
        </button>
      </div>

      {draft && (
        <div className="card mt-6 space-y-4 p-5">
          <h2 className="text-xl font-bold text-brand">{draft.id ? "Edit member" : "New member"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Name *</label>
              <input className="input" value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Position * (e.g. President)</label>
              <input className="input" value={draft.position ?? ""} onChange={(e) => setDraft({ ...draft, position: e.target.value })} />
            </div>
            <div>
              <label className="label">Facebook link</label>
              <input className="input" value={draft.facebook_url ?? ""} onChange={(e) => setDraft({ ...draft, facebook_url: e.target.value })} />
            </div>
            <div>
              <label className="label">Display order (small number shows first)</label>
              <input type="number" className="input" value={draft.sort_order ?? 0} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="label">Short bio</label>
            <textarea rows={3} className="input" value={draft.bio ?? ""} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />
          </div>
          <div>
            <label className="label">Photo</label>
            <ImageUpload folder="members" value={draft.photo_url} onChange={(u) => setDraft({ ...draft, photo_url: u })} />
          </div>
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
        {list.length === 0 && <p className="text-zinc-500">No members yet.</p>}
        {list.map((m) => (
          <div key={m.id} className="card flex items-center gap-4 p-4">
            {m.photo_url ? (
              <img src={m.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg text-brand">{m.name[0]}</div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-white">{m.name}</p>
              <p className="truncate text-sm text-zinc-400">
                {m.position} · order {m.sort_order}
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setDraft(m); setErr(""); }}>
              Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => remove(m)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
