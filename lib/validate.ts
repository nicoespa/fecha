const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function cleanTitle(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  return (s || "Nueva junta").slice(0, 80);
}

export function cleanName(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  return (s || "Anónimo").slice(0, 40);
}

export function cleanDays(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const d of v) {
    if (typeof d === "string" && DAY_RE.test(d) && !seen.has(d)) {
      const parsed = new Date(d + "T00:00:00");
      if (!Number.isNaN(parsed.getTime())) {
        seen.add(d);
        out.push(d);
      }
    }
  }
  out.sort();
  return out.slice(0, 21);
}

export function cleanSlots(v: unknown, total: number): number[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<number>();
  for (const x of v) {
    const n = typeof x === "number" ? x : Number(x);
    if (Number.isInteger(n) && n >= 0 && n < total) seen.add(n);
  }
  return [...seen].sort((a, b) => a - b);
}
