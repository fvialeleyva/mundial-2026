"use client";

import { useState } from "react";
import { Match } from "@/types";
import { STAGE_NAMES } from "@/lib/matches";
import { limaTime } from "@/lib/timezone";

type SaveStatus = "idle" | "saving" | "ok" | "error";
type RowState = { t1: string; f1: string; t2: string; f2: string };

// ── Result row ────────────────────────────────────────────────────────────────

function ResultRow({ match, override }: { match: Match; override: Partial<Match> }) {
  const effectiveT1 = override.t1 ?? match.t1;
  const effectiveT2 = override.t2 ?? match.t2;
  const initial = override.r ?? match.r ?? "";
  const [r, setR] = useState(initial);
  const [status, setStatus] = useState<SaveStatus>("idle");

  const isDirty = r !== initial;

  const save = async () => {
    setStatus("saving");
    try {
      const res = await fetch("/api/admin/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: match.id, r }),
      });
      setStatus(res.ok ? "ok" : "error");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  const inp = "bg-espresso border border-espresso-border rounded px-2 py-1 text-crema text-sm w-16 text-center focus:outline-none focus:border-verde font-mono";

  return (
    <div className="flex items-center gap-2 py-2 border-b border-espresso-border last:border-b-0">
      <span className="text-xs text-muted w-[70px] shrink-0 font-mono">{limaTime(match.u)}</span>
      <span className="text-xs text-crema flex-1 min-w-0 truncate">
        {match.f1} {effectiveT1} <span className="text-muted">vs</span> {effectiveT2} {match.f2}
      </span>
      <input
        value={r}
        onChange={e => setR(e.target.value)}
        placeholder="0-0"
        className={inp}
      />
      <button
        onClick={save}
        disabled={!isDirty || status === "saving"}
        className={[
          "px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer shrink-0 w-16",
          status === "ok"    ? "bg-verde/20 text-verde border border-verde" :
          status === "error" ? "bg-red-900/30 text-red-400 border border-red-700" :
          isDirty            ? "bg-verde text-espresso hover:bg-verde/80" :
                               "bg-espresso border border-espresso-border text-muted cursor-not-allowed",
        ].join(" ")}
      >
        {status === "saving" ? "…" :
         status === "ok"     ? "✓ OK" :
         status === "error"  ? "Error" :
         "Guardar"}
      </button>
    </div>
  );
}

// ── Team name row (existing) ──────────────────────────────────────────────────

function TeamRow({ match, override }: { match: Match; override: Partial<Match> }) {
  const initial: RowState = {
    t1: override.t1 ?? match.t1,
    f1: override.f1 ?? match.f1,
    t2: override.t2 ?? match.t2,
    f2: override.f2 ?? match.f2,
  };
  const [vals, setVals] = useState<RowState>(initial);
  const [status, setStatus] = useState<SaveStatus>("idle");

  const isDirty =
    vals.t1 !== initial.t1 || vals.f1 !== initial.f1 ||
    vals.t2 !== initial.t2 || vals.f2 !== initial.f2;

  const save = async () => {
    setStatus("saving");
    try {
      const res = await fetch("/api/admin/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: match.id, ...vals }),
      });
      setStatus(res.ok ? "ok" : "error");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  const inp = "bg-espresso border border-espresso-border rounded px-2 py-1 text-crema text-sm w-full focus:outline-none focus:border-verde";
  const flag = "bg-espresso border border-espresso-border rounded px-2 py-1 text-crema text-sm w-14 text-center focus:outline-none focus:border-verde";

  return (
    <div className="border border-espresso-border rounded-xl bg-espresso-light p-4 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold text-muted uppercase tracking-widest">{STAGE_NAMES[match.s]}</span>
        {match.g && <span className="text-xs text-muted">· Grupo {match.g}</span>}
        <span className="text-xs text-muted ml-auto">{limaTime(match.u)} Lima · ID {match.id}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        <div className="flex gap-1.5">
          <input value={vals.f1} onChange={e => setVals(v => ({ ...v, f1: e.target.value }))} className={flag} placeholder="🏳️" />
          <input value={vals.t1} onChange={e => setVals(v => ({ ...v, t1: e.target.value }))} className={inp} placeholder="Equipo 1" />
        </div>
        <span className="text-muted text-sm font-semibold">vs</span>
        <div className="flex gap-1.5">
          <input value={vals.t2} onChange={e => setVals(v => ({ ...v, t2: e.target.value }))} className={inp} placeholder="Equipo 2" />
          <input value={vals.f2} onChange={e => setVals(v => ({ ...v, f2: e.target.value }))} className={flag} placeholder="🏳️" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-muted">{match.v}</span>
        <button
          onClick={save}
          disabled={!isDirty || status === "saving"}
          className={[
            "px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
            status === "ok"    ? "bg-verde/20 text-verde border border-verde" :
            status === "error" ? "bg-red-900/30 text-red-400 border border-red-700" :
            isDirty            ? "bg-verde text-espresso hover:bg-verde/80" :
                                 "bg-espresso border border-espresso-border text-muted cursor-not-allowed",
          ].join(" ")}
        >
          {status === "saving" ? "Guardando…" :
           status === "ok"     ? "✓ Guardado" :
           status === "error"  ? "Error" :
           "Guardar"}
        </button>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function AdminPanel({
  allMatches,
  knockoutMatches,
  overrides,
}: {
  allMatches: Match[];
  knockoutMatches: Match[];
  overrides: Record<number, Partial<Match>>;
}) {
  // Group all matches by day key (YYYY-MM-DD Lima)
  const byDay: Record<string, Match[]> = {};
  for (const m of allMatches) {
    const d = new Date(m.u).toLocaleDateString("es-PE", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" });
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(m);
  }
  const days = Object.keys(byDay).sort((a, b) => {
    // sort ascending by actual date
    const [da, ma, ya] = a.split("/");
    const [db, mb, yb] = b.split("/");
    return new Date(`${ya}-${ma}-${da}`).getTime() - new Date(`${yb}-${mb}-${db}`).getTime();
  });

  const stages = [1, 2, 3, 4, 5, 6];

  return (
    <div>
      {/* ── RESULTADOS ── */}
      <div className="mb-10">
        <div className="text-xs font-bold uppercase tracking-widest text-verde border-b border-espresso-border pb-2 mb-4">
          Resultados
        </div>
        <p className="text-xs text-muted mb-4">
          Ingresa el marcador final (ej: <span className="text-crema font-mono">2-1</span>). Al guardar el partido queda marcado como finalizado.
        </p>
        {days.map(day => (
          <div key={day} className="mb-4">
            <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">{day}</div>
            <div className="border border-espresso-border rounded-xl bg-espresso-light px-4 py-1">
              {byDay[day].map(m => (
                <ResultRow key={m.id} match={m} override={overrides[m.id] ?? {}} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── EQUIPOS KNOCKOUT ── */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-muted border-b border-espresso-border pb-2 mb-4">
          Equipos Knockout
        </div>
        {stages.map(s => {
          const group = knockoutMatches.filter(m => m.s === s);
          if (!group.length) return null;
          return (
            <div key={s} className="mb-8">
              <div className="text-xs font-bold uppercase tracking-widest text-muted border-b border-espresso-border pb-2 mb-3">
                {STAGE_NAMES[s]}
              </div>
              {group.map(m => (
                <TeamRow key={m.id} match={m} override={overrides[m.id] ?? {}} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
