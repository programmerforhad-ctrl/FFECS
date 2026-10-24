"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Form, Question } from "@/lib/types";

type Value = string | string[];

export default function FormRunner({
  form,
  questions,
  closedReason,
}: {
  form: Form;
  questions: Question[];
  closedReason?: string;
}) {
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, Value>>({});
  const [hp, setHp] = useState(""); // honeypot for bots
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (id: string, v: Value) => setAnswers((a) => ({ ...a, [id]: v }));
  const toggle = (id: string, opt: string) => {
    const cur = (answers[id] as string[] | undefined) ?? [];
    set(id, cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (hp) {
      setDone(true);
      return;
    }
    if (form.collect_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    for (const q of questions) {
      const v = answers[q.id];
      const empty = v === undefined || (Array.isArray(v) ? v.length === 0 : String(v).trim() === "");
      if (q.required && empty) {
        setError(`Please answer: ${q.label}`);
        return;
      }
    }

    setBusy(true);
    const payload = {
      form_id: form.id,
      respondent_email: form.collect_email ? email.trim().toLowerCase() : null,
      answers: questions.map((q) => ({
        question_id: q.id,
        label: q.label,
        type: q.type,
        value: answers[q.id] ?? (q.type === "checkbox" ? [] : ""),
      })),
    };
    const { error: err } = await supabase.from("form_responses").insert(payload);
    setBusy(false);
    if (err) {
      setError(
        err.code === "23505" ? "This email has already been used to submit this form." : err.message
      );
      return;
    }
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const header = (
    <div className="card mb-4 border-t-4 border-t-brand p-6">
      <h1 className="text-3xl font-bold text-white">{form.title}</h1>
      {form.description && <p className="mt-3 whitespace-pre-line text-zinc-400">{form.description}</p>}
    </div>
  );

  if (done) {
    return (
      <>
        {header}
        <div className="card p-6 text-center">
          <p className="text-4xl">✅</p>
          <p className="mt-3 whitespace-pre-line text-lg text-white">{form.success_message}</p>
        </div>
      </>
    );
  }

  if (closedReason) {
    return (
      <>
        {header}
        <div className="card p-6 text-center text-zinc-300">{closedReason}</div>
      </>
    );
  }

  return (
    <>
      {header}
      <form onSubmit={submit} className="space-y-4" noValidate>
        {form.collect_email && (
          <div className="card p-5">
            <label className="label">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              className="input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        )}

        {questions.map((q) => (
          <div key={q.id} className="card p-5">
            <label className="label">
              {q.label} {q.required && <span className="text-red-400">*</span>}
            </label>
            {q.help_text && <p className="-mt-1 mb-2 text-xs text-zinc-500">{q.help_text}</p>}

            {q.type === "short_text" && (
              <input className="input" value={(answers[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} />
            )}
            {q.type === "long_text" && (
              <textarea rows={4} className="input" value={(answers[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} />
            )}
            {q.type === "number" && (
              <input type="number" className="input" value={(answers[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} />
            )}
            {q.type === "phone" && (
              <input type="tel" className="input" placeholder="01XXXXXXXXX" value={(answers[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} />
            )}
            {q.type === "email" && (
              <input type="email" className="input" value={(answers[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} />
            )}
            {q.type === "date" && (
              <input type="date" className="input" value={(answers[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} />
            )}
            {q.type === "dropdown" && (
              <select className="input" value={(answers[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)}>
                <option value="">Choose…</option>
                {q.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            )}
            {q.type === "radio" && (
              <div className="space-y-2">
                {q.options.map((o) => (
                  <label key={o} className="flex cursor-pointer items-center gap-3 text-sm text-zinc-200">
                    <input
                      type="radio"
                      name={q.id}
                      className="h-4 w-4 accent-[#ff4d1a]"
                      checked={answers[q.id] === o}
                      onChange={() => set(q.id, o)}
                    />
                    {o}
                  </label>
                ))}
              </div>
            )}
            {q.type === "checkbox" && (
              <div className="space-y-2">
                {q.options.map((o) => (
                  <label key={o} className="flex cursor-pointer items-center gap-3 text-sm text-zinc-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#ff4d1a]"
                      checked={((answers[q.id] as string[] | undefined) ?? []).includes(o)}
                      onChange={() => toggle(q.id, o)}
                    />
                    {o}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* honeypot: hidden from humans */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />

        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
        )}

        <button type="submit" disabled={busy} className="btn btn-primary w-full py-3 text-base">
          {busy ? "Submitting…" : "Submit"}
        </button>
      </form>
    </>
  );
}
