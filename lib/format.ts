const TZ = "Asia/Dhaka";
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

export function fmtDateTime(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function dayParts(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-GB", { timeZone: TZ, day: "2-digit" }),
    month: d.toLocaleDateString("en-GB", { timeZone: TZ, month: "short" }),
  };
}

// <input type="datetime-local"> value (treated as Bangladesh time) <-> ISO string
export function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + DHAKA_OFFSET_MS).toISOString().slice(0, 16);
}

export function fromLocalInput(v?: string | null): string | null {
  if (!v) return null;
  return new Date(`${v}:00+06:00`).toISOString();
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}
