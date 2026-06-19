"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { AvailabilityGrid } from "./AvailabilityGrid";
import { GroupView } from "./GroupView";
import { newPid } from "@/lib/id";
import { dayLong, totalSlots } from "@/lib/slots";
import type { EventMeta, Participant } from "@/lib/types";

type Tab = "me" | "group";

export function EventClient({
  meta,
  initialParticipants,
}: {
  meta: EventMeta;
  initialParticipants: Participant[];
}) {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [pid, setPid] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [gateOpen, setGateOpen] = useState(false);
  const [gateName, setGateName] = useState("");
  const [tab, setTab] = useState<Tab>("me");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [save, setSave] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pidKey = `fecha:pid:${meta.slug}`;
  const nameKey = `fecha:name:${meta.slug}`;

  // Boot: restore identity, init my selection from server
  useEffect(() => {
    setUrl(window.location.href);
    const savedPid = localStorage.getItem(pidKey);
    const savedName = localStorage.getItem(nameKey);
    if (savedPid && savedName) {
      setPid(savedPid);
      setName(savedName);
      const mine = initialParticipants.find((p) => p.pid === savedPid);
      if (mine) setSelected(new Set(mine.slots));
    } else {
      setGateOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for everyone else's updates
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch(`/api/events/${meta.slug}`, { cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json();
        if (alive && Array.isArray(data.participants)) {
          setParticipants(data.participants);
        }
      } catch {
        /* offline; keep last state */
      }
    };
    const id = setInterval(tick, 2500);
    const onVis = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVis);
    tick();
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.slug]);

  // My selection always wins for my own row (no clobber from polling)
  const merged = useMemo<Participant[]>(() => {
    const others = participants.filter((p) => p.pid !== pid);
    if (pid && name) {
      others.push({
        pid,
        name,
        slots: [...selected].sort((a, b) => a - b),
        updatedAt: Date.now(),
      });
    }
    return others.sort((a, b) => a.updatedAt - b.updatedAt);
  }, [participants, pid, name, selected]);

  const persist = useCallback(
    (slots: number[], who: { pid: string; name: string }) => {
      setSave("saving");
      fetch(`/api/events/${meta.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid: who.pid, name: who.name, slots }),
      })
        .then((r) => setSave(r.ok ? "saved" : "error"))
        .catch(() => setSave("error"));
    },
    [meta.slug],
  );

  const handleChange = useCallback(
    (next: Set<number>) => {
      setSelected(next);
      if (!pid || !name) return;
      setSave("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        persist([...next].sort((a, b) => a - b), { pid, name });
      }, 550);
    },
    [pid, name, persist],
  );

  const submitName = () => {
    const n = gateName.trim().slice(0, 40);
    if (!n) return;
    let id = pid ?? localStorage.getItem(pidKey);
    if (!id) {
      id = newPid();
      localStorage.setItem(pidKey, id);
    }
    localStorage.setItem(nameKey, n);
    setPid(id);
    setName(n);
    setGateOpen(false);
    // immediately register so others see you joined
    persist([...selected].sort((a, b) => a - b), { pid: id, name: n });
  };

  const copy = async () => {
    try {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        await navigator.share({ title: meta.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const respondedCount = useMemo(() => {
    const ids = new Set(participants.map((p) => p.pid));
    if (pid && name) ids.add(pid);
    return ids.size;
  }, [participants, pid, name]);

  const myCount = selected.size;
  const total = totalSlots(meta);

  return (
    <div className="min-h-full">
      <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 flex items-center justify-between">
        <Logo />
        <Link href="/" className="btn btn-subtle text-sm">
          + Nueva junta
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-28 pt-6">
        {/* Title + share */}
        <section className="fade-up">
          <h1 className="display text-[2rem] sm:text-[2.6rem] leading-[1.02]">
            {meta.title}
          </h1>
          <p className="text-[var(--muted)] mt-2 text-sm sm:text-base">
            del{" "}
            <span className="text-[var(--text)] capitalize">
              {dayLong(meta.days[0])}
            </span>{" "}
            al{" "}
            <span className="text-[var(--text)] capitalize">
              {dayLong(meta.days[meta.days.length - 1])}
            </span>
          </p>

          <div className="card p-3 mt-4 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="label mb-1">Link para compartir</div>
              <div className="truncate text-sm text-[var(--muted)] mono">
                {url || "…"}
              </div>
            </div>
            <button onClick={copy} className="btn btn-primary shrink-0">
              {copied ? "¡Copiado!" : "Copiar link"}
            </button>
          </div>
        </section>

        {/* Stats + tabs */}
        <section
          className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between fade-up"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-center gap-2">
            <Avatars participants={merged} />
            <span className="text-sm text-[var(--muted)]">
              {respondedCount === 0
                ? "Nadie respondió aún"
                : `${respondedCount} ${respondedCount === 1 ? "persona" : "personas"}`}
            </span>
          </div>
          <div className="seg w-full sm:w-auto">
            <button
              className="flex-1 sm:flex-none"
              data-active={tab === "me"}
              onClick={() => setTab("me")}
            >
              Mi disponibilidad
            </button>
            <button
              className="flex-1 sm:flex-none"
              data-active={tab === "group"}
              onClick={() => setTab("group")}
            >
              Quién puede
            </button>
          </div>
        </section>

        {/* Content */}
        <section className="mt-5">
          {tab === "me" ? (
            <div className="fade-up" style={{ animationDelay: "100ms" }}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-sm text-[var(--muted)] max-w-md">
                  {name ? (
                    <>
                      <strong className="text-[var(--text)]">Arrastrá</strong> para
                      marcar cuándo podés. De nuevo para borrar.
                    </>
                  ) : (
                    "Poné tu nombre para empezar."
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <SaveBadge state={save} />
                  {myCount > 0 && (
                    <button
                      onClick={() => handleChange(new Set())}
                      className="btn btn-subtle text-xs"
                    >
                      Borrar todo
                    </button>
                  )}
                </div>
              </div>

              {name ? (
                <>
                  <AvailabilityGrid
                    meta={meta}
                    value={selected}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-[var(--faint)] mt-3">
                    Marcaste {myCount} {myCount === 1 ? "franja" : "franjas"} ·
                    sos <button onClick={() => { setGateName(name); setGateOpen(true); }} className="underline underline-offset-2 hover:text-[var(--text)]">{name}</button>
                  </p>
                </>
              ) : (
                <button
                  onClick={() => setGateOpen(true)}
                  className="btn btn-primary"
                >
                  Poner mi nombre
                </button>
              )}
            </div>
          ) : (
            <GroupView meta={meta} participants={merged} myPid={pid} />
          )}
        </section>
      </main>

      {gateOpen && (
        <NameGate
          value={gateName}
          onChange={setGateName}
          onSubmit={submitName}
          onClose={pid ? () => setGateOpen(false) : undefined}
        />
      )}
    </div>
  );
}

function Avatars({ participants }: { participants: Participant[] }) {
  const shown = participants.slice(0, 4);
  const colors = ["#3ee389", "#6db8ff", "#ff9d54", "#c98bff"];
  if (shown.length === 0) return null;
  return (
    <div className="flex -space-x-2">
      {shown.map((p, i) => (
        <span
          key={p.pid}
          title={p.name}
          className="h-7 w-7 rounded-full grid place-items-center text-[0.7rem] font-bold border-2"
          style={{
            background: colors[i % colors.length],
            color: "#04150c",
            borderColor: "var(--bg)",
          }}
        >
          {p.name.charAt(0).toUpperCase()}
        </span>
      ))}
    </div>
  );
}

function SaveBadge({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  if (state === "idle") return null;
  const map = {
    saving: { t: "Guardando…", c: "var(--muted)" },
    saved: { t: "Guardado ✓", c: "var(--mint)" },
    error: { t: "Error al guardar", c: "var(--ember)" },
  } as const;
  const { t, c } = map[state];
  return (
    <span className="text-xs font-medium" style={{ color: c }}>
      {t}
    </span>
  );
}

function NameGate({
  value,
  onChange,
  onSubmit,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onClose?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="card p-6 w-full max-w-sm pop"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="display text-[1.4rem] mb-1">¿Cómo te llamás?</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Así el resto sabe quién puede.
        </p>
        <input
          autoFocus
          className="input"
          placeholder="Tu nombre"
          value={value}
          maxLength={40}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />
        <button
          onClick={onSubmit}
          disabled={!value.trim()}
          className="btn btn-primary w-full mt-4"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
