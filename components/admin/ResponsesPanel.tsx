"use client";

import { useMemo, useState } from "react";
import type { Answer, FormResponse, Question } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";

type Col = { key: string; label: string };

const isUrl = (v: unknown): v is string => typeof v === "string" && /^https?:\/\//i.test(v);

function text(a?: Answer): string {
  if (!a) return "";
  return Array.isArray(a.value) ? a.value.join(", ") : String(a.value ?? "");
}

function Cell({ a }: { a?: Answer }) {
  const v = text(a);
  if (!v) return <span className="text-zinc-600">—</span>;
  if (isUrl(v)) {
    return (
      <a href={v} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
        {a?.type === "file" ? "View photo ↗" : "Open ↗"}
      </a>
    );
  }
  return <span className="whitespace-pre-line break-words">{v}</span>;
}

export default function ResponsesPanel({
  questions,
  responses,
  collectEmail,
  onDelete,
  onExport,
}: {
  questions: Question[];
  responses: FormResponse[];
  collectEmail: boolean;
  onDelete: (r: FormResponse) => void;
  onExport: () => void;
}) {
  const [view, setView] = useState<"table" | "cards">("table");
  const [q, setQ] = useState("");

  // Columns follow the current question order; answers to deleted questions are still shown at the end.
  const cols: Col[] = useMemo(() => {
    const list: Col[] = questions.filter((x) => x.label.trim()).map((x) => ({ key: x.id, label: x.label }));
    const known = new Set(list.map((c) => c.key));
    responses.forEach((r) =>
      r.answers.forEach((a) => {
        if (!known.has(a.question_id)) {
          known.add(a.question_id);
          list.push({ key: a.question_id, label: a.label });
        }
      })
    );
    return list;
  }, [questions, responses]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return responses;
    return responses.filter((r) => `${r.respondent_email ?? ""} ${r.answers.map((a) => text(a)).join(" ")}`.toLowerCase().includes(s));
  }, [q, responses]);

  const todayCount = responses.filter((r) => Date.now() - new Date(r.created_at).getTime() < 86400000).length;

  return (
    <div className="mt-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Total responses</p>
          <p className="mt-1 font-display text-3xl font-bold text-white">{responses.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Last 24 hours</p>
          <p className="mt-1 font-display text-3xl font-bold text-white">{todayCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Latest</p>
          <p className="mt-2 text-sm text-white">{responses[0] ? fmtDateTime(responses[0].created_at) : "—"}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input className="input max-w-xs" placeholder="Search name, email, UID…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex overflow-hidden rounded-lg border border-line text-sm">
          {(["table", "cards"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-2 font-medium ${view === v ? "bg-brand/15 text-brand" : "text-zinc-400 hover:text-white"}`}
            >
              {v === "table" ? "Table" : "Cards"}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm ml-auto" disabled={!responses.length} onClick={onExport}>
          Download CSV (Excel)
        </button>
      </div>

      {responses.length === 0 && <p className="mt-6 text-zinc-500">No responses yet. Share the form link to start collecting.</p>}
      {responses.length > 0 && filtered.length === 0 && <p className="mt-6 text-zinc-500">No response matches your search.</p>}

      {filtered.length > 0 && view === "table" && (
        <div className="card mt-4 max-h-[70vh] overflow-auto">
          <table className="w-full min-w-max border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#0d0d12] text-xs uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="border-b border-line px-3 py-3">#</th>
                <th className="border-b border-line px-3 py-3">Submitted</th>
                {collectEmail && <th className="border-b border-line px-3 py-3">Email</th>}
                {cols.map((c) => (
                  <th key={c.key} className="max-w-[16rem] border-b border-line px-3 py-3">
                    {c.label}
                  </th>
                ))}
                <th className="border-b border-line px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="odd:bg-white/[0.02] hover:bg-white/[0.04]">
                  <td className="border-b border-line px-3 py-2.5 text-zinc-500">{responses.length - responses.indexOf(r)}</td>
                  <td className="whitespace-nowrap border-b border-line px-3 py-2.5 text-zinc-400">{fmtDateTime(r.created_at)}</td>
                  {collectEmail && <td className="border-b border-line px-3 py-2.5 text-white">{r.respondent_email ?? "—"}</td>}
                  {cols.map((c) => (
                    <td key={c.key} className="max-w-[16rem] border-b border-line px-3 py-2.5 align-top text-zinc-200">
                      <Cell a={r.answers.find((a) => a.question_id === c.key)} />
                    </td>
                  ))}
                  <td className="border-b border-line px-3 py-2.5">
                    <button className="text-xs text-red-400 hover:underline" onClick={() => onDelete(r)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && view === "cards" && (
        <div className="mt-4 space-y-3">
          {filtered.map((r) => (
            <details key={r.id} className="card p-4">
              <summary className="flex cursor-pointer flex-wrap items-center gap-3">
                <span className="font-display text-lg font-bold text-zinc-500">#{responses.length - responses.indexOf(r)}</span>
                <span className="min-w-0 flex-1 truncate font-semibold text-white">{r.respondent_email || "(no email)"}</span>
                <span className="text-xs text-zinc-500">{fmtDateTime(r.created_at)}</span>
              </summary>
              <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
                {r.answers.map((a) => (
                  <div key={a.question_id}>
                    <dt className="text-xs uppercase tracking-wider text-zinc-500">{a.label}</dt>
                    <dd className="mt-0.5 text-zinc-100">
                      <Cell a={a} />
                    </dd>
                  </div>
                ))}
              </dl>
              <button className="btn btn-danger btn-sm mt-4" onClick={() => onDelete(r)}>
                Delete response
              </button>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
