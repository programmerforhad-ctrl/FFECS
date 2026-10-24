"use client";

import { useState } from "react";
import { BUCKET, supabase } from "@/lib/supabase";

export default function ImageUpload({
  value,
  onChange,
  folder = "uploads",
}: {
  value?: string | null;
  onChange: (url: string) => void;
  folder?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErr("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) return setErr("Image must be under 5 MB.");
    setErr("");
    setBusy(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
    });
    setBusy(false);
    if (error) return setErr(error.message);
    onChange(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <img src={value} alt="" className="h-16 w-16 rounded-lg border border-line object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-line text-xs text-zinc-600">
          none
        </div>
      )}
      <div className="min-w-0">
        <label className="btn btn-ghost btn-sm cursor-pointer">
          {busy ? "Uploading…" : value ? "Change image" : "Upload image"}
          <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={busy} />
        </label>
        {value && (
          <button type="button" className="ml-2 text-xs text-red-400 hover:underline" onClick={() => onChange("")}>
            Remove
          </button>
        )}
        {err && <p className="mt-1 text-xs text-red-400">{err}</p>}
      </div>
    </div>
  );
}
