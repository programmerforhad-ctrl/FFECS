"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { checkImageFile, uploadToDrive } from "@/lib/drive";
import { CountdownText } from "./Countdown";
import type { Form, Question } from "@/lib/types";

type Value = string | string[];

function Preview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url ? <img src={url} alt="" className="h-20 w-20 rounded-lg border border-line object-cover" /> : null;
}

export default function FormRunner({
  form,
  questions,
  closedReason,
  driveUrl,
  brandName,
  logo,
}: {
  form: Form;
  questions: Question[];
  closedReason?: string;
  driveUrl?: string;
  brandName: string;
  logo?: string;
}) {
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, Value>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [hp, setHp] = useState(""); // honeypot for bots
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [fieldErr, setFieldErr] = useState("");
  const [done, setDone] = useState(false);

  const set = (id: string, v: Value) => setAnswers((a) => ({ ...a, [id]: v }));
  const toggle = (id: string, opt: string) => {
    const cur = (answers[id] as string[] | undefined) ?? [];
    set(id, cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]);
  };

  function pickFile(q: Question, f: File | undefined) {
    if (!f) return;
    const problem = checkImageFile(f);
    if (problem) {
      setFieldErr(q.id);
      setError(problem);
      return;
    }
    setError("");
    setFieldErr("");
    setFiles((p) => ({ ...p, [q.id]: f }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErr("");
    if (hp) {
      setDone(true);
      return;
    }
    if (form.collect_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setFieldErr("email");
      setError("Please enter a valid email address.");
      return;
    }
    for (const q of questions) {
      let empty: boolean;
      if (q.type === "file") empty = !files[q.id];
      else {
        const v = answers[q.id];
        empty = v === undefined || (Array.isArray(v) ? v.length === 0 : String(v).trim() === "");
      }
      if (q.required && empty) {
        setFieldErr(q.id);
        setError(`Please answer: ${q.label}`);
        document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      // The captain UID becomes the team's portal password, so it must be a real numeric UID.
      if (q.role === "captain_uid") {
        const digits = String(answers[q.id] ?? "").replace(/\D/g, "");
        if (!/^\d{5,15}$/.test(digits)) {
          setFieldErr(q.id);
          setError("Enter your Free Fire UID using digits only (5 to 15 numbers).");
          document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
      }
    }
    const needsDrive = questions.some((q) => q.type === "file" && files[q.id]);
    if (needsDrive && !driveUrl) {
      setError("Photo upload is not set up yet. Please contact the admin.");
      return;
    }

    try {
      // 1) upload photos to Google Drive
      const driveLinks: Record<string, string> = {};
      let n = 0;
      const total = questions.filter((q) => q.type === "file" && files[q.id]).length;
      for (const q of questions) {
        const f = q.type === "file" ? files[q.id] : null;
        if (!f) continue;
        n++;
        setBusy(`Uploading photo ${n} of ${total}…`);
        driveLinks[q.id] = await uploadToDrive(driveUrl!, f, form.title);
      }

      // 2) save the response
      setBusy("Submitting…");
      const payload = {
        form_id: form.id,
        respondent_email: form.collect_email ? email.trim().toLowerCase() : null,
        answers: questions.map((q) => ({
          question_id: q.id,
          label: q.label,
          type: q.type,
          value: q.type === "file" ? driveLinks[q.id] ?? "" : answers[q.id] ?? (q.type === "checkbox" ? [] : ""),
        })),
      };
      const { error: err } = await supabase.from("form_responses").insert(payload);
      if (err) {
        setError(err.code === "23505" ? "This email has already been used to submit this form." : err.message);
        setBusy("");
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Something went wrong. Please try again.");
    }
    setBusy("");
  }

  const banner = (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="h-2 bg-gradient-to-r from-brand to-brand2" />
      <div className="p-6 sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          {logo ? (
            <img src={logo} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand2 font-display text-lg font-bold text-black">
              FF
            </span>
          )}
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">{brandName}</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">{form.title}</h1>
        {form.description && <p className="mt-3 whitespace-pre-line text-zinc-400">{form.description}</p>}
        {!done && !closedReason && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-zinc-500">
            <span>
              <span className="text-red-400">*</span> Required
            </span>
            {form.deadline && (
              <span className="text-zinc-300">
                Closes in <CountdownText target={form.deadline} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (done) {
    return (
      <div className="space-y-4">
        {banner}
        <div className="card p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 text-3xl text-green-400">✓</div>
          <p className="mt-4 whitespace-pre-line text-lg text-white">{form.success_message}</p>
          <Link href="/" className="btn btn-ghost mt-6">
            Back to website
          </Link>
        </div>
      </div>
    );
  }

  if (closedReason) {
    return (
      <div className="space-y-4">
        {banner}
        <div className="card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-2xl">🔒</div>
          <p className="mt-4 text-lg text-white">{closedReason}</p>
          <Link href="/" className="btn btn-ghost mt-6">
            Back to website
          </Link>
        </div>
      </div>
    );
  }

  const ringFor = (id: string) => (fieldErr === id ? "border-red-500/70" : "border-line focus-within:border-brand/70");
  const tile = (active: boolean) =>
    `flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
      active ? "border-brand bg-brand/10 text-white" : "border-line bg-field text-zinc-300 hover:border-zinc-600"
    }`;

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {banner}

      {form.collect_email && (
        <div id="q-email" className={`rounded-2xl border bg-panel p-5 sm:p-6 ${ringFor("email")}`}>
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

      {questions.map((q, i) => (
        <div key={q.id} id={`q-${q.id}`} className={`rounded-2xl border bg-panel p-5 transition sm:p-6 ${ringFor(q.id)}`}>
          <div className="mb-3 flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand">
              {i + 1}
            </span>
            <div>
              <p className="font-medium text-white">
                {q.label} {q.required && <span className="text-red-400">*</span>}
              </p>
              {q.help_text && <p className="mt-0.5 text-xs text-zinc-500">{q.help_text}</p>}
            </div>
          </div>

          {q.type === "short_text" && (
            <input
              className="input"
              inputMode={q.role === "captain_uid" ? "numeric" : undefined}
              value={(answers[q.id] as string) ?? ""}
              onChange={(e) => set(q.id, e.target.value)}
              placeholder={q.role === "captain_uid" ? "e.g. 123456789" : "Your answer"}
            />
          )}
          {q.type === "long_text" && (
            <textarea rows={4} className="input" value={(answers[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} placeholder="Your answer" />
          )}
          {q.type === "number" && (
            <input type="number" inputMode="numeric" className="input" value={(answers[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} placeholder="Your answer" />
          )}
          {q.type === "phone" && (
            <input type="tel" inputMode="tel" className="input" placeholder="01XXXXXXXXX" value={(answers[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} />
          )}
          {q.type === "email" && (
            <input type="email" className="input" placeholder="name@email.com" value={(answers[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} />
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
            <div className="grid gap-2">
              {q.options.map((o) => (
                <label key={o} className={tile(answers[q.id] === o)}>
                  <input type="radio" name={q.id} className="h-4 w-4 accent-[#ff7a29]" checked={answers[q.id] === o} onChange={() => set(q.id, o)} />
                  {o}
                </label>
              ))}
            </div>
          )}
          {q.type === "checkbox" && (
            <div className="grid gap-2">
              {q.options.map((o) => {
                const on = ((answers[q.id] as string[] | undefined) ?? []).includes(o);
                return (
                  <label key={o} className={tile(on)}>
                    <input type="checkbox" className="h-4 w-4 accent-[#ff7a29]" checked={on} onChange={() => toggle(q.id, o)} />
                    {o}
                  </label>
                );
              })}
            </div>
          )}
          {q.type === "file" && (
            <div>
              {files[q.id] ? (
                <div className="flex items-center gap-4 rounded-xl border border-line bg-field p-3">
                  <Preview file={files[q.id]!} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">{files[q.id]!.name}</p>
                    <p className="text-xs text-zinc-500">{(files[q.id]!.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setFiles((p) => ({ ...p, [q.id]: null }))}>
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-field px-4 py-8 text-center transition hover:border-brand/60">
                  <span className="text-2xl">📷</span>
                  <span className="text-sm font-medium text-white">Tap to choose a photo</span>
                  <span className="text-xs text-zinc-500">JPG, PNG or WebP</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { pickFile(q, e.target.files?.[0]); e.target.value = ""; }} />
                </label>
              )}
            </div>
          )}
        </div>
      ))}

      {/* honeypot: hidden from humans */}
      <input type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} className="hidden" aria-hidden="true" />

      {error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <button type="submit" disabled={!!busy} className="btn btn-primary w-full py-3.5 text-base">
        {busy || "Submit"}
      </button>
      <p className="pb-4 text-center text-xs text-zinc-600">Never submit passwords or payment card details through this form.</p>
    </form>
  );
}
