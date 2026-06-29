"use client";

import { Match } from "@/types";
import { limaTime, limaDateKey } from "@/lib/timezone";

// Ordered match IDs per round, top→bottom, matching bracket tree
const ROUNDS: { label: string; ids: number[] }[] = [
  { label: "Ronda 32",  ids: [73, 75, 74, 77, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87] },
  { label: "Octavos",   ids: [90, 89, 93, 94, 91, 92, 95, 96] },
  { label: "Cuartos",   ids: [97, 98, 99, 100] },
  { label: "Semifinal", ids: [101, 102] },
  { label: "Final",     ids: [104] },
];

const SLOT_H  = 88;
const CARD_H  = 72;
const COL_W   = 150;
const COL_GAP = 28;
const TOTAL_H = SLOT_H * 16;

const DAYS_SHORT   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS_SHORT = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function shortDate(utc: string): string {
  // Use Lima offset (UTC-5)
  const d = new Date(new Date(utc).getTime() - 5 * 3600_000);
  return `${DAYS_SHORT[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`;
}

function isPlaceholder(name: string): boolean {
  return !name || /^(Gan\.|Per\.|Sub\.|1\.º|Mej\.)/.test(name);
}

function TeamRow({
  flag, name, score, isWinner, isLoser,
}: {
  flag: string; name: string; score: number | null; isWinner: boolean; isLoser: boolean;
}) {
  const placeholder = isPlaceholder(name);
  return (
    <div
      className={[
        "flex items-center gap-[5px] px-[7px] py-[5px]",
        isWinner ? "bg-ink" : "",
      ].join(" ")}
    >
      <span className="text-[13px] leading-none shrink-0 w-[18px] text-center">
        {flag || "·"}
      </span>
      <span
        className={[
          "flex-1 font-display font-[700] text-[11px] uppercase leading-tight truncate",
          isWinner ? "text-cream" : isLoser ? "text-muted line-through" : placeholder ? "text-muted-2" : "text-ink",
        ].join(" ")}
      >
        {name || "—"}
      </span>
      {score !== null && (
        <span
          className={[
            "font-mono font-bold text-[12px] leading-none shrink-0 ml-1",
            isWinner ? "text-cream" : isLoser ? "text-muted" : "text-ink",
          ].join(" ")}
        >
          {score}
        </span>
      )}
    </div>
  );
}

function MatchCard({ match: m, top, left }: { match: Match; top: number; left: number }) {
  const [s1, s2] = m.r ? m.r.split("-").map(Number) : [null, null];
  const hasScore = s1 !== null && s2 !== null;
  const w1 = m.done && hasScore && s1! > s2!;
  const w2 = m.done && hasScore && s2! > s1!;

  const now = new Date();
  const start = new Date(m.u);
  const end = new Date(start.getTime() + 110 * 60_000);
  const live = !m.done && start <= now && now <= end;

  const ph1 = isPlaceholder(m.t1);
  const ph2 = isPlaceholder(m.t2);
  const pending = ph1 && ph2;

  const isFinal = m.s === 6;
  const isSemi  = m.s === 4 || m.s === 5;

  let shadow = "";
  if (live)        shadow = "shadow-[2px_2px_0_#E04127]";
  else if (pending) shadow = "";
  else if (isFinal) shadow = "shadow-[4px_4px_0_#D69A2C]";
  else if (isSemi)  shadow = "shadow-[3px_3px_0_#D69A2C]";
  else if (m.s >= 2) shadow = "shadow-[2px_2px_0_#2B53C2]";

  return (
    <div
      style={{ position: "absolute", top, left, width: COL_W, height: CARD_H }}
      className={[
        "rounded-[6px] overflow-hidden flex flex-col",
        pending
          ? "border-[2px] border-dashed border-hairline bg-card-2"
          : `border-[${isFinal ? "3" : "2"}px] border-ink bg-card`,
        shadow,
      ].join(" ")}
    >
      {live && (
        <div className="h-[3px]" style={{
          backgroundImage: "repeating-linear-gradient(45deg,#E04127 0 5px,transparent 5px 10px)"
        }} />
      )}
      <div className="flex-1 flex flex-col justify-center divide-y divide-hairline">
        <TeamRow flag={m.f1} name={m.t1} score={s1} isWinner={w1} isLoser={w2} />
        <TeamRow flag={m.f2} name={m.t2} score={s2} isWinner={w2} isLoser={w1} />
      </div>
      <div className="bg-card-2 border-t border-hairline px-[7px] py-[3px] flex items-center justify-between shrink-0">
        <span className="font-mono text-[7.5px] text-muted uppercase tracking-[0.05em] leading-none">
          {shortDate(m.u)}
        </span>
        <span className={[
          "font-mono text-[7.5px] font-bold uppercase tracking-[0.05em] leading-none",
          live ? "text-vermilion" : "text-muted",
        ].join(" ")}>
          {live ? "EN VIVO" : limaTime(m.u)}
        </span>
      </div>
    </div>
  );
}

export default function BracketView({ matches }: { matches: Match[] }) {
  const byId = Object.fromEntries(matches.map(m => [m.id, m]));
  const totalW = ROUNDS.length * COL_W + (ROUNDS.length - 1) * COL_GAP;

  return (
    <div className="overflow-auto" style={{ maxHeight: "calc(100dvh - 128px)" }}>
      {/* Round labels */}
      <div
        className="flex sticky top-0 z-10 bg-paper border-b-[1.5px] border-hairline"
        style={{ width: totalW }}
      >
        {ROUNDS.map((r, i) => (
          <div
            key={i}
            style={{ width: COL_W, marginRight: i < ROUNDS.length - 1 ? COL_GAP : 0 }}
            className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-muted text-center py-[6px] shrink-0"
          >
            {r.label}
          </div>
        ))}
      </div>

      {/* Bracket */}
      <div style={{ position: "relative", width: totalW, height: TOTAL_H }}>

        {/* SVG connector lines */}
        <svg
          style={{ position: "absolute", inset: 0, width: totalW, height: TOTAL_H, pointerEvents: "none" }}
        >
          {ROUNDS.slice(0, -1).map((round, rIdx) => {
            const multiplier = Math.pow(2, rIdx);
            const slotH = SLOT_H * multiplier;
            const x1   = rIdx * (COL_W + COL_GAP) + COL_W;
            const x2   = (rIdx + 1) * (COL_W + COL_GAP);
            const xMid = x1 + COL_GAP / 2;

            return round.ids.map((_, mIdx) => {
              if (mIdx % 2 !== 0) return null;
              const y1   = (mIdx + 0.5) * slotH;
              const y2   = (mIdx + 1.5) * slotH;
              const yMid = (y1 + y2) / 2;
              return (
                <g key={`${rIdx}-${mIdx}`} stroke="#D8CDB7" strokeWidth="1.5" fill="none">
                  <line x1={x1}   y1={y1}   x2={xMid} y2={y1}   />
                  <line x1={x1}   y1={y2}   x2={xMid} y2={y2}   />
                  <line x1={xMid} y1={y1}   x2={xMid} y2={y2}   />
                  <line x1={xMid} y1={yMid} x2={x2}   y2={yMid} />
                </g>
              );
            });
          })}
        </svg>

        {/* Match cards */}
        {ROUNDS.map((round, rIdx) => {
          const multiplier = Math.pow(2, rIdx);
          const slotH = SLOT_H * multiplier;
          const left  = rIdx * (COL_W + COL_GAP);
          return round.ids.map((id, mIdx) => {
            const m = byId[id];
            if (!m) return null;
            const centerY = (mIdx + 0.5) * slotH;
            const top     = centerY - CARD_H / 2;
            return <MatchCard key={id} match={m} top={top} left={left} />;
          });
        })}
      </div>
    </div>
  );
}
