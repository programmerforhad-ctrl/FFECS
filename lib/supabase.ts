import { createClient } from "@supabase/supabase-js";

// Placeholders keep `next build` from crashing when env vars are missing.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder-key";

export const supabase = createClient(url, key);

// Public storage bucket used for logos, member photos, banners.
export const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "Info";
