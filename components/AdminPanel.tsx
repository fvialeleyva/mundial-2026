"use client";

import { useState } from "react";
import { Match } from "@/types";
import { STAGE_NAMES } from "@/lib/matches";
import { limaTime } from "@/lib/timezone";

type RowState = { t1: string; f1: string; t2: string; f2: string };
type SaveStatus = "idle" | "saving" | "ok" | "error";

function MatchRow({
  match,
  override,
}: {
  match: Match;
  override: Partial<Match>;
}) {
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
        {/* Equipo 1 */}
        <div className="flex gap-1.5">
          <input
            value={vals.f1}
            onChange={e => setVals(v => ({ ...v, f1: e.target.value }))}
            className={flag}
            placeholder="🏳️"
          />
          <input
            value={vals.t1}
            onChange={e => setVals(v => ({ ...v, t1: e.target.value }))}
            className={inp}
            placeholder="Equipo 1"
          />
        </div>

        <span className="text-muted text-sm font-semibold">vs</span>

        {/* Equipo 2 */}
        <div className="flex gap-1.5">
          <input
            value={vals.t2}
            onChange={e => setVals(v => ({ ...v, t2: e.target.value }))}
            className={inp}
            placeholder="Equipo 2"
          />
          <input
            value={vals.f2}
            onChange={e => setVals(v => ({ ...v, f2: e.target.value }))}
            className={flag}
            placeholder="🏳️"
          />
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

export default function AdminPanel({
  matches,
  overrides,
}: {
  matches: Match[];
  overrides: Record<number, Partial<Match>>;
}) {
  const stages = [1, 2, 3, 4, 5, 6];

  return (
    <div>
      {stages.map(s => {
        const group = matches.filter(m => m.s === s);
        if (!group.length) return null;
        return (
          <div key={s} className="mb-8">
            <div className="text-xs font-bold uppercase tracking-widest text-muted border-b border-espresso-border pb-2 mb-3">
              {STAGE_NAMES[s]}
            </div>
            {group.map(m => (
              <MatchRow key={m.id} match={m} override={overrides[m.id] ?? {}} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
