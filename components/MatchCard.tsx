"use client";

import { Match } from "@/types";
import { STAGE_NAMES, STAGE_CLS } from "@/lib/matches";
import { limaTime, isPast, isLive, gcalDate } from "@/lib/timezone";

interface Props {
  match: Match;
  starred: boolean;
  calDone: boolean;
  onToggleStar: (id: number) => void;
  onAddCal: (id: number) => void;
}

export default function MatchCard({ match: m, starred, calDone, onToggleStar, onAddCal }: Props) {
  const past = isPast(m.u);
  const live = isLive(m.u, m.done);

  const stageCls = STAGE_CLS[m.s];
  const stageColor =
    stageCls === "final"    ? "bg-red-900/20 text-red-400 border-red-800/30" :
    stageCls === "knockout" ? "bg-naranja/10 text-naranja border-naranja/25" :
                              "bg-verde/10 text-verde border-verde/20";

  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-3 mb-1.5 border transition-colors",
        "bg-espresso-light border-espresso-border border-l-4",
        m.done      ? "opacity-45"                                         : "",
        starred     ? "border-l-naranja!"                                  : "border-l-transparent",
        live        ? "animate-live border-l-rojo! bg-red-950/20"          : "",
      ].join(" ")}
    >
      {/* Time */}
      <div className={`text-sm font-bold min-w-[44px] text-center shrink-0 ${past && !live ? "text-muted" : "text-verde"}`}>
        {m.done && m.r ? m.r : limaTime(m.u)}
      </div>

      {/* Match info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap text-sm font-semibold text-crema">
          {m.f1 && <span>{m.f1}</span>}
          <span>{m.t1}</span>
          <span className="text-espresso-border text-xs">vs</span>
          {m.f2 && <span>{m.f2}</span>}
          <span>{m.t2}</span>
          {live && (
            <span className="text-xs font-bold text-rojo bg-red-950/30 border border-red-800/30 px-2 py-0.5 rounded-full">
              🔴 EN VIVO
            </span>
          )}
        </div>
        <div className="text-xs text-muted mt-0.5 truncate">
          <span className={`inline-block text-xs font-bold border px-1.5 py-0.5 rounded mr-1.5 ${stageColor}`}>
            {STAGE_NAMES[m.s]}{m.g ? ` · Gr.${m.g}` : ""}
          </span>
          {m.v}
        </div>
      </div>

      {/* Actions */}
      {!m.done && (
        <div className="flex gap-1.5 shrink-0 items-center">
          <button
            onClick={() => onToggleStar(m.id)}
            className={[
              "px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors cursor-pointer",
              starred
                ? "bg-naranja/15 border-naranja text-naranja"
                : "border-espresso-border text-muted hover:border-naranja hover:text-naranja",
            ].join(" ")}
          >
            {starred ? "⭐ Ver" : "☆ Ver"}
          </button>
          <button
            onClick={() => onAddCal(m.id)}
            className={[
              "px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors cursor-pointer",
              calDone
                ? "bg-verde/5 border-verde-dim text-verde-dim"
                : "bg-verde/10 border-verde/30 text-verde hover:bg-verde/20",
            ].join(" ")}
          >
            {calDone ? "✅" : "📅"}
          </button>
        </div>
      )}
    </div>
  );
}
