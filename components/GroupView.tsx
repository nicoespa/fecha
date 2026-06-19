"use client";

import { useMemo, useRef, useState } from "react";
import { GridFrame, type CellSpec } from "./GridFrame";
import {
  bestBlocks,
  countsBySlot,
  dayHeader,
  dayLong,
  minutesToLabel,
  slotStartMin,
  slotsPerDay,
} from "@/lib/slots";
import type { EventMeta, Participant } from "@/lib/types";

const PALETTE = [
  "#3ee389",
  "#6db8ff",
  "#ff9d54",
  "#c98bff",
  "#ffd14d",
  "#ff7a9c",
  "#5ee0c8",
  "#b6e85a",
];

export function colorFor(i: number): string {
  return PALETTE[i % PALETTE.length];
}

export function GroupView({
  meta,
  participants,
  myPid,
}: {
  meta: EventMeta;
  participants: Participant[];
  myPid: string | null;
}) {
  const spd = slotsPerDay(meta);
  const total = participants.length;
  const counts = useMemo(
    () => countsBySlot(meta, participants),
    [meta, participants],
  );
  const peak = useMemo(() => Math.max(0, ...counts), [counts]);
  const blocks = useMemo(
    () => bestBlocks(meta, participants, 4),
    [meta, participants],
  );

  const [active, setActive] = useState<number | null>(null);
  const [pulse, setPulse] = useState<Set<number>>(new Set());
  const gridWrapRef = useRef<HTMLDivElement>(null);

  const cellFromPoint = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const c = el?.closest("[data-idx]") as HTMLElement | null;
    if (!c || c.dataset.idx === undefined) return null;
    return +c.dataset.idx;
  };

  const renderCell = (_d: number, _s: number, idx: number): CellSpec => {
    const count = counts[idx];
    const ratio = peak > 0 ? count / peak : 0;
    const everyone = total > 0 && count === total;
    let cls = "heat-cell";
    if (active === idx) cls += " heat-active";
    else if (everyone) cls += " heat-best";
    if (pulse.has(idx)) cls += " cell-pulse";
    return {
      className: cls,
      style: {
        background:
          count === 0
            ? "var(--surface)"
            : `rgba(var(--mint-rgb), ${(0.16 + 0.74 * ratio).toFixed(3)})`,
      },
      content:
        count > 0 ? (
          <span
            className="absolute inset-0 grid place-items-center text-[0.64rem] font-bold mono"
            style={{
              color: ratio > 0.5 ? "#04150c" : "rgba(255,255,255,0.55)",
            }}
          >
            {count}
          </span>
        ) : undefined,
      ariaLabel: `${dayLong(meta.days[_d])} ${minutesToLabel(slotStartMin(meta, _s))}: ${count} de ${total}`,
    };
  };

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const idx = cellFromPoint(e.clientX, e.clientY);
    if (idx !== null) setActive(idx);
  };

  const focusBlock = (cells: number[]) => {
    setActive(cells[0]);
    setPulse(new Set(cells));
    gridWrapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => setPulse(new Set()), 2100);
  };

  // active cell breakdown
  const activeInfo = useMemo(() => {
    if (active === null) return null;
    const day = Math.floor(active / spd);
    const s = active % spd;
    const yes = participants.filter((p) => p.slots.includes(active));
    const no = participants.filter((p) => !p.slots.includes(active));
    return { day, s, yes, no };
  }, [active, participants, spd]);

  if (total === 0) {
    return (
      <div className="card p-8 text-center fade-up">
        <div className="text-3xl mb-3">🫥</div>
        <p className="text-[var(--text)] font-semibold mb-1">
          Todavía no respondió nadie
        </p>
        <p className="text-sm text-[var(--muted)]">
          Compartí el link y cargá tu disponibilidad. Acá vas a ver el mapa de
          quién puede, en vivo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Best times */}
      <div className="fade-up">
        <div className="flex items-baseline justify-between mb-2.5">
          <h3 className="display text-[1.05rem]">Mejores horarios</h3>
          <span className="text-xs text-[var(--muted)]">
            pico: {peak} de {total}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {blocks.map((b, i) => {
            const cells: number[] = [];
            for (let s = b.startSlot; s <= b.endSlot; s++)
              cells.push(b.dayIdx * spd + s);
            const everyone = b.count === total;
            return (
              <button
                key={i}
                onClick={() => focusBlock(cells)}
                className="card p-3.5 text-left hover:border-[var(--border-strong)] transition-colors"
                style={
                  everyone
                    ? { borderColor: "rgba(var(--mint-rgb),0.5)" }
                    : undefined
                }
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[0.7rem] uppercase tracking-wider font-bold text-[var(--muted)]">
                    {dayHeader(b.dayStr).dow} {dayHeader(b.dayStr).day}{" "}
                    {dayHeader(b.dayStr).month}
                  </span>
                  <span
                    className={everyone ? "pill pill-mint" : "pill"}
                    style={{ padding: "0.15rem 0.55rem" }}
                  >
                    {everyone ? "todos" : `${b.count}/${total}`}
                  </span>
                </div>
                <div className="display text-[1.15rem] mono">
                  {b.startLabel}–{b.endLabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Who panel */}
      <div
        className="card p-4 min-h-[92px] fade-up"
        style={{ animationDelay: "60ms" }}
      >
        {activeInfo ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold capitalize">
                {dayLong(meta.days[activeInfo.day])}
              </span>
              <span className="mono text-sm text-[var(--mint-bright)]">
                {minutesToLabel(slotStartMin(meta, activeInfo.s))}–
                {minutesToLabel(slotStartMin(meta, activeInfo.s) + meta.slotMin)}
              </span>
              <span className="ml-auto text-xs text-[var(--muted)]">
                {activeInfo.yes.length} de {total}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeInfo.yes.map((p) => (
                <NameChip key={p.pid} p={p} me={p.pid === myPid} available />
              ))}
              {activeInfo.no.map((p) => (
                <NameChip key={p.pid} p={p} me={p.pid === myPid} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--muted)] flex items-center gap-2 h-full">
            <span className="text-base">👆</span>
            Pasá el dedo o el mouse por la grilla para ver quién puede en cada
            franja.
          </p>
        )}
      </div>

      {/* Heatmap */}
      <div ref={gridWrapRef} className="fade-up" style={{ animationDelay: "120ms" }}>
        <div
          onPointerMove={handleMove}
          onPointerDown={handleMove}
        >
          <GridFrame meta={meta} renderCell={renderCell} rowHeight={32} />
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-[var(--muted)]">
          <span>menos</span>
          <div className="flex-1 h-2 rounded-full max-w-[160px]"
            style={{
              background:
                "linear-gradient(90deg, var(--surface), rgba(var(--mint-rgb),0.9))",
            }}
          />
          <span>todos</span>
        </div>
      </div>
    </div>
  );
}

function NameChip({
  p,
  me,
  available,
}: {
  p: Participant;
  me: boolean;
  available?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        background: available ? "rgba(var(--mint-rgb),0.12)" : "var(--surface-3)",
        color: available ? "var(--mint-bright)" : "var(--faint)",
        border: available
          ? "1px solid rgba(var(--mint-rgb),0.3)"
          : "1px solid var(--border)",
        textDecoration: available ? "none" : "line-through",
      }}
    >
      {p.name}
      {me && <span className="opacity-70">· vos</span>}
    </span>
  );
}
