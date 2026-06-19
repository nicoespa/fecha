import type { EventMeta, Participant } from "./types";

const DOW = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const DOW_LONG = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];
const MONTH = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** Parse "YYYY-MM-DD" as a local date (no timezone surprises). */
export function parseDay(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toDayStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dayHeader(s: string): { dow: string; day: number; month: string } {
  const d = parseDay(s);
  return { dow: DOW[d.getDay()], day: d.getDate(), month: MONTH[d.getMonth()] };
}

export function dayLong(s: string): string {
  const d = parseDay(s);
  return `${DOW_LONG[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]}`;
}

export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function slotsPerDay(meta: EventMeta): number {
  return Math.max(0, Math.round((meta.endMin - meta.startMin) / meta.slotMin));
}

export function totalSlots(meta: EventMeta): number {
  return slotsPerDay(meta) * meta.days.length;
}

export function globalIndex(meta: EventMeta, dayIdx: number, slotInDay: number): number {
  return dayIdx * slotsPerDay(meta) + slotInDay;
}

export function slotStartMin(meta: EventMeta, slotInDay: number): number {
  return meta.startMin + slotInDay * meta.slotMin;
}

/** Time labels shown on the left rail of the grid. */
export function rowLabels(meta: EventMeta): string[] {
  const out: string[] = [];
  for (let i = 0; i < slotsPerDay(meta); i++) {
    out.push(minutesToLabel(slotStartMin(meta, i)));
  }
  return out;
}

/** Count of available people per global slot index. */
export function countsBySlot(meta: EventMeta, participants: Participant[]): number[] {
  const counts = new Array(totalSlots(meta)).fill(0);
  for (const p of participants) {
    for (const idx of p.slots) {
      if (idx >= 0 && idx < counts.length) counts[idx]++;
    }
  }
  return counts;
}

export interface BestBlock {
  dayIdx: number;
  startSlot: number;
  endSlot: number; // inclusive
  count: number;
  dayStr: string;
  startLabel: string;
  endLabel: string;
}

/**
 * Find the contiguous blocks where the most people overlap.
 * Returns the runs at the peak availability, sorted by duration then earliness.
 */
export function bestBlocks(
  meta: EventMeta,
  participants: Participant[],
  maxResults = 4,
): BestBlock[] {
  const counts = countsBySlot(meta, participants);
  const spd = slotsPerDay(meta);
  const peak = Math.max(0, ...counts);
  if (peak === 0) return [];

  const blocks: BestBlock[] = [];
  for (let day = 0; day < meta.days.length; day++) {
    let run = -1;
    for (let s = 0; s <= spd; s++) {
      const idx = day * spd + s;
      const isPeak = s < spd && counts[idx] === peak;
      if (isPeak && run === -1) {
        run = s;
      } else if (!isPeak && run !== -1) {
        blocks.push(makeBlock(meta, day, run, s - 1, peak));
        run = -1;
      }
    }
  }

  blocks.sort((a, b) => {
    const da = a.endSlot - a.startSlot;
    const db = b.endSlot - b.startSlot;
    if (db !== da) return db - da;
    if (a.dayIdx !== b.dayIdx) return a.dayIdx - b.dayIdx;
    return a.startSlot - b.startSlot;
  });
  return blocks.slice(0, maxResults);
}

function makeBlock(
  meta: EventMeta,
  dayIdx: number,
  startSlot: number,
  endSlot: number,
  count: number,
): BestBlock {
  return {
    dayIdx,
    startSlot,
    endSlot,
    count,
    dayStr: meta.days[dayIdx],
    startLabel: minutesToLabel(slotStartMin(meta, startSlot)),
    endLabel: minutesToLabel(slotStartMin(meta, endSlot) + meta.slotMin),
  };
}

// ---- Builders for the create form ----

/** Monday..Sunday of the week containing `ref`. */
export function weekOf(ref: Date): { from: string; to: string } {
  const day = ref.getDay(); // 0 Sun..6 Sat
  const diffToMon = (day + 6) % 7;
  const mon = new Date(ref);
  mon.setDate(ref.getDate() - diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { from: toDayStr(mon), to: toDayStr(sun) };
}

export function nextDays(ref: Date, n: number): { from: string; to: string } {
  const end = new Date(ref);
  end.setDate(ref.getDate() + n - 1);
  return { from: toDayStr(ref), to: toDayStr(end) };
}

/** Expand an inclusive [from, to] range into an ordered list of day strings. */
export function daysBetween(from: string, to: string, cap = 21): string[] {
  const start = parseDay(from);
  const end = parseDay(to);
  const out: string[] = [];
  const cur = new Date(start);
  while (cur <= end && out.length < cap) {
    out.push(toDayStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}
