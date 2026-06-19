"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  daysBetween,
  nextDays,
  parseDay,
  toDayStr,
  weekOf,
} from "@/lib/slots";

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export function CreateForm() {
  const router = useRouter();
  const init = nextDays(today(), 7);

  const [title, setTitle] = useState("");
  const [from, setFrom] = useState(init.from);
  const [to, setTo] = useState(init.to);
  const [startH, setStartH] = useState(9);
  const [endH, setEndH] = useState(24);
  const [slotMin, setSlotMin] = useState<30 | 60>(60);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const days = useMemo(() => {
    if (parseDay(to) < parseDay(from)) return [];
    return daysBetween(from, to);
  }, [from, to]);

  const slotsPerDay = useMemo(() => {
    const s = startH * 60;
    const e = endH * 60;
    return e > s ? Math.round((e - s) / slotMin) : 0;
  }, [startH, endH, slotMin]);

  const valid = days.length > 0 && slotsPerDay > 0;

  const setRange = (r: { from: string; to: string }) => {
    setFrom(r.from);
    setTo(r.to);
  };

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          days,
          startMin: startH * 60,
          endMin: endH * 60,
          slotMin,
          tz:
            Intl.DateTimeFormat().resolvedOptions().timeZone ||
            "America/Argentina/Buenos_Aires",
        }),
      });
      if (!r.ok) throw new Error("create_failed");
      const { slug } = await r.json();
      router.push(`/e/${slug}`);
    } catch {
      setErr("No se pudo crear. Probá de nuevo.");
      setBusy(false);
    }
  };

  return (
    <div className="card p-5 sm:p-6 fade-up" style={{ animationDelay: "120ms" }}>
      <div className="mb-5">
        <label className="label" htmlFor="t">
          ¿Qué quieren organizar?
        </label>
        <input
          id="t"
          className="input text-lg"
          placeholder="Asado del finde 🔥"
          value={title}
          maxLength={80}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>

      <div className="mb-5">
        <label className="label">¿Qué días entran?</label>
        <div className="flex flex-wrap gap-2 mb-3">
          <Chip onClick={() => setRange(weekOf(today()))} label="Esta semana" />
          <Chip
            onClick={() => setRange(nextDays(today(), 7))}
            label="Próx. 7 días"
          />
          <Chip onClick={() => setRange(weekend())} label="Este finde" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-[var(--faint)] mb-1 block">Desde</span>
            <input
              type="date"
              className="input"
              value={from}
              min={toDayStr(today())}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <span className="text-xs text-[var(--faint)] mb-1 block">Hasta</span>
            <input
              type="date"
              className="input"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <label className="label">Franja horaria</label>
          <div className="flex items-center gap-2">
            <HourSelect value={startH} onChange={setStartH} max={23} />
            <span className="text-[var(--faint)]">a</span>
            <HourSelect value={endH} onChange={setEndH} min={1} max={24} />
          </div>
        </div>
        <div>
          <label className="label">Bloques de</label>
          <div className="seg w-full">
            <button
              data-active={slotMin === 60}
              onClick={() => setSlotMin(60)}
              className="flex-1"
            >
              1 hora
            </button>
            <button
              data-active={slotMin === 30}
              onClick={() => setSlotMin(30)}
              className="flex-1"
            >
              30 min
            </button>
          </div>
        </div>
      </div>

      {err && <p className="text-sm text-[var(--ember)] mb-3">{err}</p>}

      <button
        onClick={submit}
        disabled={!valid || busy}
        className="btn btn-primary w-full text-base py-3.5"
      >
        {busy ? "Creando…" : "Crear y compartir →"}
      </button>

      <p className="text-center text-xs text-[var(--faint)] mt-3">
        {valid
          ? `${days.length} ${days.length === 1 ? "día" : "días"} · ${slotsPerDay} bloques por día`
          : "Elegí un rango de días y horas válido"}
      </p>
    </div>
  );
}

function weekend(): { from: string; to: string } {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const toSat = (6 - day + 7) % 7;
  const sat = new Date(d);
  sat.setDate(d.getDate() + toSat);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  return { from: toDayStr(sat), to: toDayStr(sun) };
}

function Chip({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="pill hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-colors"
    >
      {label}
    </button>
  );
}

function HourSelect({
  value,
  onChange,
  min = 0,
  max = 23,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const opts = [];
  for (let h = min; h <= max; h++) opts.push(h);
  return (
    <select
      className="input flex-1 cursor-pointer"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {opts.map((h) => (
        <option key={h} value={h}>
          {String(h).padStart(2, "0")}:00
        </option>
      ))}
    </select>
  );
}
