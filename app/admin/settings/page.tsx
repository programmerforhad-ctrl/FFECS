"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SETTINGS_FIELDS } from "@/lib/settings";
import ImageUpload from "@/components/admin/ImageUpload";

export default function SettingsAdmin() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key,value")
      .then(({ data }) => {
        setVals(Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""])));
        setLoaded(true);
      });
  }, []);

  const set = (k: string, v: string) => setVals((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true);
    setMsg("");
    const rows = SETTINGS_FIELDS.map((f) => ({ key: f.key, value: vals[f.key] ?? "" }));
    const { error } = await supabase.from("site_settings").upsert(rows);
    setBusy(false);
    setMsg(error ? `Error: ${error.message}` : "Saved. The website updates within about 30 seconds.");
  }

  const groups = Array.from(new Set(SETTINGS_FIELDS.map((f) => f.group)));
  if (!loaded) return <p className="text-zinc-500">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-white">Site Settings</h1>
      <p className="mt-1 text-zinc-400">About text, contact info, social links, logo and hero image.</p>

      {groups.map((g) => (
        <section key={g} className="card mt-6 space-y-4 p-5">
          <h2 className="text-xl font-bold text-brand">{g}</h2>
          {SETTINGS_FIELDS.filter((f) => f.group === g).map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              {f.type === "text" && (
                <input className="input" placeholder={f.placeholder} value={vals[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
              )}
              {f.type === "textarea" && (
                <textarea rows={5} className="input" value={vals[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
              )}
              {f.type === "image" && <ImageUpload folder="site" value={vals[f.key]} onChange={(u) => set(f.key, u)} />}
            </div>
          ))}
        </section>
      ))}

      <div className="sticky bottom-0 -mx-4 mt-6 flex items-center gap-4 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl">
        <button onClick={save} disabled={busy} className="btn btn-primary">
          {busy ? "Saving…" : "Save all"}
        </button>
        {msg && <span className={`text-sm ${msg.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>{msg}</span>}
      </div>
    </div>
  );
}
