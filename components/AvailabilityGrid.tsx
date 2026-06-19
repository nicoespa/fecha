"use client";

import { useCallback, useRef, useState } from "react";
import { GridFrame, type CellSpec } from "./GridFrame";
import { dayLong, minutesToLabel, slotStartMin, slotsPerDay } from "@/lib/slots";
import type { EventMeta } from "@/lib/types";

type Mode = "add" | "erase";
interface Cell {
  d: number;
  s: number;
  idx: number;
}

const SELECTED =
  "linear-gradient(180deg, rgba(var(--mint-rgb),0.95), rgba(var(--mint-rgb),0.8))";
const PREVIEW_ADD = "rgba(var(--mint-rgb),0.5)";
const PREVIEW_ERASE = "rgba(var(--ember-rgb),0.5)";

export function AvailabilityGrid({
  meta,
  value,
  onChange,
}: {
  meta: EventMeta;
  value: Set<number>;
  onChange: (next: Set<number>) => void;
}) {
  const spd = slotsPerDay(meta);
  const drag = useRef<{ anchor: Cell; mode: Mode } | null>(null);
  const previewRef = useRef<{ cells: Set<number>; mode: Mode } | null>(null);
  const [preview, setPreviewState] = useState<{ cells: Set<number>; mode: Mode } | null>(
    null,
  );

  const setPreview = (p: { cells: Set<number>; mode: Mode } | null) => {
    previewRef.current = p;
    setPreviewState(p);
  };

  const cellFromPoint = (x: number, y: number): Cell | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const c = el?.closest("[data-idx]") as HTMLElement | null;
    if (!c || c.dataset.idx === undefined || c.dataset.d === undefined) return null;
    return { d: +c.dataset.d, s: +(c.dataset.s ?? 0), idx: +c.dataset.idx };
  };

  const rectCells = (a: Cell, b: Cell): Set<number> => {
    const d0 = Math.min(a.d, b.d);
    const d1 = Math.max(a.d, b.d);
    const s0 = Math.min(a.s, b.s);
    const s1 = Math.max(a.s, b.s);
    const out = new Set<number>();
    for (let d = d0; d <= d1; d++)
      for (let s = s0; s <= s1; s++) out.add(d * spd + s);
    return out;
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const cell = cellFromPoint(e.clientX, e.clientY);
      if (!cell) return;
      e.preventDefault();
      const mode: Mode = value.has(cell.idx) ? "erase" : "add";
      drag.current = { anchor: cell, mode };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      setPreview({ cells: rectCells(cell, cell), mode });
    },
    [value, spd],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!drag.current) return;
      const cell = cellFromPoint(e.clientX, e.clientY);
      if (!cell) return;
      setPreview({
        cells: rectCells(drag.current.anchor, cell),
        mode: drag.current.mode,
      });
    },
    [spd],
  );

  const commit = useCallback(() => {
    const d = drag.current;
    const pv = previewRef.current;
    drag.current = null;
    setPreview(null);
    if (!d || !pv) return;
    const next = new Set(value);
    for (const i of pv.cells) {
      if (d.mode === "add") next.add(i);
      else next.delete(i);
    }
    onChange(next);
  }, [value, onChange]);

  const renderCell = (d: number, s: number, idx: number): CellSpec => {
    const on = value.has(idx);
    const inPv = preview?.cells.has(idx) ?? false;
    let bg: string | undefined;
    if (inPv) {
      if (preview!.mode === "add") bg = on ? SELECTED : PREVIEW_ADD;
      else bg = on ? PREVIEW_ERASE : undefined;
    } else if (on) {
      bg = SELECTED;
    }
    const cls = "paint-cell" + (!bg ? " paint-empty" : "");
    return {
      className: cls,
      style: bg
        ? {
            background: bg,
            ...(on && !inPv
              ? { boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }
              : {}),
          }
        : undefined,
      ariaLabel: `${dayLong(meta.days[d])} ${minutesToLabel(slotStartMin(meta, s))}${on ? " (disponible)" : ""}`,
    };
  };

  return (
    <GridFrame
      meta={meta}
      renderCell={renderCell}
      interactive
      cellsHandlers={{
        onPointerDown,
        onPointerMove,
        onPointerUp: commit,
        onPointerCancel: commit,
      }}
    />
  );
}
