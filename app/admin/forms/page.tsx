"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Form } from "@/lib/types";
import { fmtDate, slugify } from "@/lib/format";

export default function FormsAdmin() {
  const router = useRouter();
  const [list, setList] = useState<Form[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [loadErr, setLoadErr] = useState("");
  const [copied, setCopied] = useState("");

  const load = async () => {
    const { data, error } = await supabase.from("forms").select("*").order("created_at", { ascending: false });
    if (error) {
      setLoadErr(`Could not load forms: ${error.message}. Run supabase/schema.sql in the Supabase SQL Editor, and make sure your account is in the admins table.`);
      return;
    }
    setLoadErr("");
    const forms = (data ?? []) as Form[];
    setList(forms);
    // response counts, one cheap query per form
    forms.forEach(async (f) => {
      const { count } = await supabase.from("form_responses").select("id", { count: "exact", head: true }).eq("form_id", f.id);
      setCounts((c) => ({ ...c, [f.id]: count ?? 0 }));
    });
  };
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setErr("Please type a form title first.");
    setBusy(true);
    setErr("");
    const slug = `${slugify(title) || "form"}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase.from("forms").insert({ title: title.trim(), slug }).select("id").single();
    setBusy(false);
    if (error || !data) {
      return setErr(
        `Could not create the form: ${error?.message ?? "unknown error"}${
          /row-level security|permission/i.test(error?.message ?? "")
            ? " — this account is not in the admins table. Run the admin SQL from the README with the same email you logged in with."
            : ""
        }`
      );
    }
    router.push(`/admin/forms/${data.id}`);
  }

  async function remove(f: Form) {
    if (!confirm(`Delete "${f.title}" and ALL its responses? This cannot be undone.`)) return;
    const { error } = await supabase.from("forms").delete().eq("id", f.id);
    if (error) return setErr(error.message);
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
      {err && <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{err}</p>}
      {loadErr && <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{loadErr}</p>}

      <div className="mt-6 space-y-3">
        {!loadErr && list.length === 0 && <p className="text-zinc-500">No forms yet.</p>}
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
                {counts[f.id] ?? "…"} responses · created {fmtDate(f.created_at)}
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
