"use client";

import type { CSSProperties, ReactNode } from "react";
import type { EventMeta } from "@/lib/types";
import { dayHeader, rowLabels, slotsPerDay, slotStartMin } from "@/lib/slots";

export interface CellSpec {
  className?: string;
  style?: CSSProperties;
  content?: ReactNode;
  ariaLabel?: string;
}

interface Props {
  meta: EventMeta;
  renderCell: (dayIdx: number, slotInDay: number, idx: number) => CellSpec;
  cellsHandlers?: {
    onPointerDown?: React.PointerEventHandler<HTMLDivElement>;
    onPointerMove?: React.PointerEventHandler<HTMLDivElement>;
    onPointerUp?: React.PointerEventHandler<HTMLDivElement>;
    onPointerLeave?: React.PointerEventHandler<HTMLDivElement>;
    onPointerCancel?: React.PointerEventHandler<HTMLDivElement>;
  };
  rowHeight?: number;
  interactive?: boolean;
}

export function GridFrame({
  meta,
  renderCell,
  cellsHandlers,
  rowHeight = 32,
  interactive = false,
}: Props) {
  const spd = slotsPerDay(meta);
  const labels = rowLabels(meta);
  const nDays = meta.days.length;

  const template: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `46px repeat(${nDays}, minmax(40px, 1fr))`,
    gridTemplateRows: `auto repeat(${spd}, ${rowHeight}px)`,
    gap: "0",
  };

  return (
    <div className="overflow-x-auto -mx-1 px-1 pb-1">
      <div
        style={{ minWidth: nDays > 7 ? `${46 + nDays * 44}px` : undefined }}
      >
        <div
          style={template}
          className={interactive ? "grid-surface" : undefined}
          {...(cellsHandlers ?? {})}
        >
          {/* corner */}
          <div className="sticky left-0 z-20" style={{ background: "var(--bg)" }} />

          {/* day headers */}
          {meta.days.map((d, di) => {
            const h = dayHeader(d);
            const weekend = h.dow === "SÁB" || h.dow === "DOM";
            return (
              <div
                key={d}
                className="flex flex-col items-center justify-center pb-2 pt-1 select-none"
              >
                <span
                  className="text-[0.62rem] font-bold tracking-[0.12em]"
                  style={{ color: weekend ? "var(--mint)" : "var(--muted)" }}
                >
                  {h.dow}
                </span>
                <span className="display text-[1.15rem] leading-none mt-0.5">
                  {h.day}
                </span>
                <span className="text-[0.6rem] text-[var(--faint)] lowercase">
                  {h.month}
                </span>
              </div>
            );
          })}

          {/* rows */}
          {labels.map((label, s) => {
            const onHour = slotStartMin(meta, s) % 60 === 0;
            return (
              <RowFragment
                key={s}
                label={label}
                onHour={onHour}
                rowHeight={rowHeight}
                days={meta.days}
                spd={spd}
                s={s}
                renderCell={renderCell}
                interactive={interactive}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RowFragment({
  label,
  onHour,
  rowHeight,
  days,
  spd,
  s,
  renderCell,
  interactive,
}: {
  label: string;
  onHour: boolean;
  rowHeight: number;
  days: string[];
  spd: number;
  s: number;
  renderCell: (dayIdx: number, slotInDay: number, idx: number) => CellSpec;
  interactive: boolean;
}) {
  return (
    <>
      <div
        className="sticky left-0 z-10 flex items-start justify-end pr-2 pt-0.5"
        style={{ background: "var(--bg)" }}
      >
        {onHour && (
          <span className="mono text-[0.66rem] text-[var(--faint)] leading-none">
            {label}
          </span>
        )}
      </div>
      {days.map((d, di) => {
        const idx = di * spd + s;
        const spec = renderCell(di, s, idx);
        const isLastRow = s === spd - 1;
        return (
          <div
            key={d + ":" + s}
            data-d={di}
            data-s={s}
            data-idx={idx}
            role={interactive ? "button" : undefined}
            aria-label={spec.ariaLabel}
            className={`relative ${spec.className ?? ""}`}
            style={{
              height: rowHeight,
              borderRight: "1px solid var(--border)",
              borderBottom: isLastRow
                ? "1px solid var(--border)"
                : onHour
                  ? "1px solid var(--border)"
                  : "1px dashed rgba(255,255,255,0.045)",
              borderLeft: di === 0 ? "1px solid var(--border)" : undefined,
              borderTop: s === 0 ? "1px solid var(--border)" : undefined,
              ...spec.style,
            }}
          >
            {spec.content}
          </div>
        );
      })}
    </>
  );
}
