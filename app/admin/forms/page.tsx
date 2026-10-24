"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Form } from "@/lib/types";
import { fmtDate, slugify } from "@/lib/format";

type Row = Form & { form_responses: { count: number }[] };

export default function FormsAdmin() {
  const [list, setList] = useState<Row[]>([]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("forms")
      .select("*, form_responses(count)")
      .order("created_at", { ascending: false });
    setList((data ?? []) as Row[]);
  };
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setErr("");
    const base = slugify(title) || "form";
    const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase.from("forms").insert({ title: title.trim(), slug }).select("id").single();
    setBusy(false);
    if (error) return setErr(error.message);
    window.location.href = `/admin/forms/${data.id}`;
  }

  async function remove(f: Row) {
    if (!confirm(`Delete "${f.title}" and ALL its responses? This cannot be undone.`)) return;
    await supabase.from("forms").delete().eq("id", f.id);
    load();
  }

  function copy(slug: string) {
    navigator.clipboard?.writeText(`${window.location.origin}/form/${slug}`);
    setCopied(slug);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-white">Forms & Responses</h1>
      <p className="mt-1 text-zinc-400">Create a form, add questions, then share its link with everyone.</p>

      <form onSubmit={create} className="card mt-6 flex flex-col gap-3 p-5 sm:flex-row">
        <input className="input" placeholder="New form title, e.g. Free Fire Cup Registration" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="btn btn-primary shrink-0" disabled={busy}>
          {busy ? "Creating…" : "+ Create form"}
        </button>
      </form>
      {err && <p className="mt-2 text-sm text-red-400">{err}</p>}

      <div className="mt-6 space-y-3">
        {list.length === 0 && <p className="text-zinc-500">No forms yet.</p>}
        {list.map((f) => (
          <div key={f.id} className="card flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-white">
                {f.title}{" "}
                <span className={`ml-2 rounded px-2 py-0.5 text-xs ${f.is_open ? "bg-green-500/15 text-green-400" : "bg-zinc-800 text-zinc-400"}`}>
                  {f.is_open ? "open" : "closed"}
                </span>
              </p>
              <p className="text-sm text-zinc-400">
                {f.form_responses?.[0]?.count ?? 0} responses · created {fmtDate(f.created_at)}
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => copy(f.slug)}>
              {copied === f.slug ? "Copied ✓" : "Copy link"}
            </button>
            <Link href={`/admin/forms/${f.id}`} className="btn btn-primary btn-sm">
              Edit / Responses
            </Link>
            <button className="btn btn-danger btn-sm" onClick={() => remove(f)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
