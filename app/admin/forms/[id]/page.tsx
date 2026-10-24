"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Form, FormResponse, Question, QuestionType } from "@/lib/types";
import { fmtDateTime, fromLocalInput, slugify, toLocalInput } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";

const TYPES: [QuestionType, string][] = [
  ["short_text", "Short answer"],
  ["long_text", "Paragraph"],
  ["number", "Number"],
  ["phone", "Phone"],
  ["email", "Email"],
  ["date", "Date"],
  ["radio", "Multiple choice (pick one)"],
  ["checkbox", "Checkboxes (pick many)"],
  ["dropdown", "Dropdown"],
];
const hasOptions = (t: QuestionType) => t === "radio" || t === "checkbox" || t === "dropdown";

export default function FormEditor() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<"build" | "responses">("build");
  const [form, setForm] = useState<Form | null>(null);
  const [deadlineInput, setDeadlineInput] = useState("");
  const [qs, setQs] = useState<Question[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    const [f, q, r] = await Promise.all([
      supabase.from("forms").select("*").eq("id", id).maybeSingle(),
      supabase.from("form_questions").select("*").eq("form_id", id).order("sort_order"),
      supabase.from("form_responses").select("*").eq("form_id", id).order("created_at", { ascending: false }),
    ]);
    if (f.data) {
      setForm(f.data as Form);
      setDeadlineInput(toLocalInput((f.data as Form).deadline));
    }
    setQs((q.data ?? []) as Question[]);
    setResponses((r.data ?? []) as FormResponse[]);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!form) return <p className="text-zinc-500">Loading…</p>;

  const link = typeof window !== "undefined" ? `${window.location.origin}/form/${form.slug}` : `/form/${form.slug}`;

  const upQ = (i: number, patch: Partial<Question>) => setQs((a) => a.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const move = (i: number, d: number) =>
    setQs((a) => {
      const j = i + d;
      if (j < 0 || j >= a.length) return a;
      const c = [...a];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  function addQuestion() {
    setQs((a) => [
      ...a,
      {
        id: `new-${Date.now()}-${a.length}`,
        form_id: form!.id,
        label: "",
        help_text: "",
        type: "short_text",
        options: [],
        required: false,
        sort_order: a.length,
      },
    ]);
  }

  async function save() {
    setMsg("");
    const slug = slugify(form!.slug);
    if (!form!.title.trim() || !slug) return setMsg("Error: title and link name are required.");
    const clean = qs.filter((q) => q.label.trim());
    for (const q of clean) {
      if (hasOptions(q.type) && q.options.filter((o) => o.trim()).length < 1) {
        return setMsg(`Error: add at least one option to "${q.label}".`);
      }
    }
    setBusy(true);

    const { error: fe } = await supabase
      .from("forms")
      .update({
        title: form!.title.trim(),
        slug,
        description: form!.description || null,
        is_open: form!.is_open,
        collect_email: form!.collect_email,
        deadline: fromLocalInput(deadlineInput),
        max_responses: form!.max_responses ? Number(form!.max_responses) : null,
        success_message: form!.success_message || "Thank you! Your response has been recorded.",
      })
      .eq("id", form!.id);
    if (fe) {
      setBusy(false);
      return setMsg(fe.code === "23505" ? "Error: that link name is already used by another form." : `Error: ${fe.message}`);
    }

    // Existing questions are updated in place (so old responses keep matching); new ones are inserted.
    const keepIds: string[] = [];
    for (let i = 0; i < clean.length; i++) {
      const q = clean[i];
      const row = {
        form_id: form!.id,
        label: q.label.trim(),
        help_text: q.help_text || null,
        type: q.type,
        options: hasOptions(q.type) ? q.options.map((o) => o.trim()).filter(Boolean) : [],
        required: q.required,
        sort_order: i,
      };
      if (q.id.startsWith("new-")) {
        const { data, error } = await supabase.from("form_questions").insert(row).select("id").single();
        if (error) {
          setBusy(false);
          return setMsg(`Error: ${error.message}`);
        }
        keepIds.push(data.id);
      } else {
        const { error } = await supabase.from("form_questions").update(row).eq("id", q.id);
        if (error) {
          setBusy(false);
          return setMsg(`Error: ${error.message}`);
        }
        keepIds.push(q.id);
      }
    }
    const removed = qs.filter((q) => !q.id.startsWith("new-") && !keepIds.includes(q.id)).map((q) => q.id);
    if (removed.length) await supabase.from("form_questions").delete().in("id", removed);

    setBusy(false);
    setMsg("Saved ✓");
    load();
  }

  async function deleteResponse(r: FormResponse) {
    if (!confirm("Delete this response?")) return;
    await supabase.from("form_responses").delete().eq("id", r.id);
    load();
  }

  function exportCsv() {
    // Columns come from the answers stored in each response, so old responses stay correct even after questions are edited.
    const cols: string[] = [];
    responses.forEach((r) => r.answers.forEach((a) => !cols.includes(a.label) && cols.push(a.label)));
    const rows: string[][] = [["Submitted at", "Email", ...cols]];
    responses.forEach((r) => {
      rows.push([
        fmtDateTime(r.created_at),
        r.respondent_email ?? "",
        ...cols.map((c) => {
          const a = r.answers.find((x) => x.label === c);
          return a ? (Array.isArray(a.value) ? a.value.join(", ") : String(a.value ?? "")) : "";
        }),
      ]);
    });
    downloadCsv(`${form!.slug}-responses.csv`, rows);
  }

  return (
    <div className="max-w-4xl">
      <Link href="/admin/forms" className="text-sm text-zinc-400 hover:text-brand">
        ← All forms
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-white">{form.title}</h1>

      <div className="card mt-4 flex flex-wrap items-center gap-3 p-4">
        <code className="min-w-0 flex-1 break-all text-sm text-brand2">{link}</code>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            navigator.clipboard?.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
        <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
          Open ↗
        </a>
      </div>

      <div className="mt-6 flex gap-2 border-b border-line">
        {(["build", "responses"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${
              tab === t ? "border-brand text-brand" : "border-transparent text-zinc-400"
            }`}
          >
            {t === "build" ? "Questions" : `Responses (${responses.length})`}
          </button>
        ))}
      </div>

      {tab === "build" && (
        <div className="mt-6 space-y-6">
          <section className="card space-y-4 p-5">
            <h2 className="text-xl font-bold text-brand">Form settings</h2>
            <div>
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Description (shown at top of form)</label>
              <textarea rows={3} className="input" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Link name (/form/…)</label>
                <input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div>
                <label className="label">Max responses (blank = unlimited)</label>
                <input type="number" min={1} className="input" value={form.max_responses ?? ""} onChange={(e) => setForm({ ...form, max_responses: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div>
                <label className="label">Deadline (Bangladesh time, optional)</label>
                <input type="datetime-local" className="input" value={deadlineInput} onChange={(e) => setDeadlineInput(e.target.value)} />
              </div>
              <div>
                <label className="label">Message after submit</label>
                <input className="input" value={form.success_message} onChange={(e) => setForm({ ...form, success_message: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm text-zinc-200">
                <input type="checkbox" className="h-4 w-4 accent-[#ff4d1a]" checked={form.is_open} onChange={(e) => setForm({ ...form, is_open: e.target.checked })} />
                Accepting responses
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-200">
                <input type="checkbox" className="h-4 w-4 accent-[#ff4d1a]" checked={form.collect_email} onChange={(e) => setForm({ ...form, collect_email: e.target.checked })} />
                Collect email (one response per email)
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-brand">Questions</h2>
            {qs.length === 0 && <p className="text-zinc-500">No questions yet. Add the first one below.</p>}
            {qs.map((q, i) => (
              <div key={q.id} className="card space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold text-zinc-500">{i + 1}</span>
                  <input className="input" placeholder="Question" value={q.label} onChange={(e) => upQ(i, { label: e.target.value })} />
                </div>
                <input className="input" placeholder="Help text (optional)" value={q.help_text ?? ""} onChange={(e) => upQ(i, { help_text: e.target.value })} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select className="input" value={q.type} onChange={(e) => upQ(i, { type: e.target.value as QuestionType })}>
                    {TYPES.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-zinc-200">
                    <input type="checkbox" className="h-4 w-4 accent-[#ff4d1a]" checked={q.required} onChange={(e) => upQ(i, { required: e.target.checked })} />
                    Required
                  </label>
                </div>
                {hasOptions(q.type) && (
                  <div>
                    <label className="label">Options (one per line)</label>
                    <textarea
                      rows={4}
                      className="input"
                      value={q.options.join("\n")}
                      onChange={(e) => upQ(i, { options: e.target.value.split("\n") })}
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm" disabled={i === 0} onClick={() => move(i, -1)}>
                    ↑
                  </button>
                  <button className="btn btn-ghost btn-sm" disabled={i === qs.length - 1} onClick={() => move(i, 1)}>
                    ↓
                  </button>
                  <button className="btn btn-danger btn-sm ml-auto" onClick={() => setQs((a) => a.filter((_, j) => j !== i))}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button className="btn btn-ghost w-full border-dashed" onClick={addQuestion}>
              + Add question
            </button>
          </section>

          <div className="sticky bottom-0 -mx-4 flex items-center gap-4 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl">
            <button onClick={save} disabled={busy} className="btn btn-primary">
              {busy ? "Saving…" : "Save form"}
            </button>
            {msg && <span className={`text-sm ${msg.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>{msg}</span>}
          </div>
        </div>
      )}

      {tab === "responses" && (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-zinc-400">{responses.length} response(s)</p>
            <button className="btn btn-primary btn-sm" disabled={!responses.length} onClick={exportCsv}>
              Download CSV (Excel)
            </button>
          </div>
          {responses.length === 0 && <p className="text-zinc-500">No responses yet.</p>}
          <div className="space-y-3">
            {responses.map((r, n) => (
              <details key={r.id} className="card p-4">
                <summary className="flex cursor-pointer flex-wrap items-center gap-3">
                  <span className="font-display text-lg font-bold text-zinc-500">#{responses.length - n}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-white">{r.respondent_email || "(no email)"}</span>
                  <span className="text-xs text-zinc-500">{fmtDateTime(r.created_at)}</span>
                </summary>
                <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
                  {r.answers.map((a) => (
                    <div key={a.question_id}>
                      <dt className="text-xs uppercase tracking-wider text-zinc-500">{a.label}</dt>
                      <dd className="mt-0.5 whitespace-pre-line break-words text-zinc-100">
                        {Array.isArray(a.value) ? a.value.join(", ") || "—" : String(a.value || "—")}
                      </dd>
                    </div>
                  ))}
                </dl>
                <button className="btn btn-danger btn-sm mt-4" onClick={() => deleteResponse(r)}>
                  Delete response
                </button>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
