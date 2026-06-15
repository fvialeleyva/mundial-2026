"use client";

import { Match } from "@/types";
import { limaTime, isPast, isLive } from "@/lib/timezone";

interface Props {
  match: Match;
  starred: boolean;
  calDone: boolean;
  onToggleStar: (id: number) => void;
  onAddCal: (id: number) => void;
}

function flagToIso(flag: string): string {
  const cps = [...flag].map(c => c.codePointAt(0)!);
  if (cps.length === 2 && cps[0] >= 0x1F1E6 && cps[0] <= 0x1F1FF) {
    return String.fromCharCode(cps[0] - 0x1F1E6 + 65) +
           String.fromCharCode(cps[1] - 0x1F1E6 + 65);
  }
  return "";
}

const KICKER_LABELS = [
  "Fase de Grupos", "Ronda de 32", "Octavos de Final",
  "Cuartos de Final", "Semifinal", "3.er Puesto", "La Final",
];

export default function MatchCard({ match: m, starred, calDone, onToggleStar, onAddCal }: Props) {
  const past = isPast(m.u);
  const live = isLive(m.u, m.done);
  const isFinal = m.s === 6;
  const isSemi  = m.s >= 4;
  const isKO    = m.s >= 1 && m.s <= 3;

  // Time block style
  const timeBlockBg =
    past && !live ? "bg-muted"     :
    live          ? "bg-vermilion" :
    isSemi        ? "bg-gold"      :
    isKO          ? "bg-cobalt"    :
                    "bg-ink";
  const timeBlockText = (isSemi && !live && !past) ? "text-ink" : "text-cream";

  // Day abbreviation (Lima tz)
  const dayAbbr = new Date(m.u)
    .toLocaleDateString("es-PE", { timeZone: "America/Lima", weekday: "short" })
    .toUpperCase().replace(".", "");

  // Elapsed minutes for live display
  const now = new Date();
  const elapsed = live
    ? Math.min(90, Math.floor((now.getTime() - new Date(m.u).getTime()) / 60000))
    : null;
  const timeDisplay = live ? `${elapsed}'` : limaTime(m.u);

  // Kicker text + color
  const kickerText = m.g ? `GRP ${m.g} · ${KICKER_LABELS[0]}` : KICKER_LABELS[m.s];
  const kickerCls  =
    live   ? "text-muted"  :
    isSemi ? "text-gold-t" :
    isKO   ? "text-ink"    :
             "text-cobalt";

  // Score parsing
  let s1 = "", s2 = "", loser1 = false, loser2 = false;
  if ((m.done || live) && m.r) {
    const [a, b] = m.r.split("-");
    s1 = a ?? ""; s2 = b ?? "";
    const n1 = parseInt(s1), n2 = parseInt(s2);
    if (!isNaN(n1) && !isNaN(n2)) { loser1 = n1 < n2; loser2 = n2 < n1; }
  }

  // Team name / score colors
  const nameColor = (loser: boolean) =>
    live ? (loser ? "text-[#6B5E4A]" : "text-cream")
         : (loser ? "text-muted-2"    : "text-ink");

  // Card-level shadow
  const cardShadow =
    live    ? "shadow-hard-verm"    :
    isFinal ? "shadow-hard-gold-lg" :
    (isSemi || (starred && !live)) ? "shadow-hard-gold" :
    "";

  return (
    <div
      className={[
        "flex flex-col border-[2.5px] border-ink rounded-[7px] overflow-hidden mb-3",
        live   ? "bg-live-bg" : m.done ? "bg-card-2" : "bg-card",
        isFinal ? "!border-[3px]" : "",
        cardShadow,
      ].join(" ")}
    >
      {/* Final banner */}
      {isFinal && (
        <div className="stripe-gold w-full px-3 py-1.5 text-center font-display font-[900] text-[13px] uppercase tracking-[0.12em] text-ink">
          ★ LA FINAL ★
        </div>
      )}

      {/* Live diagonal stripe */}
      {live && <div className="h-[5px] w-full stripe-verm" />}

      {/* 3-zone row */}
      <div className="flex">
        {/* Time block */}
        <div
          className={`min-w-[82px] shrink-0 border-r-[2.5px] border-ink flex flex-col items-center justify-center py-3 px-[11px] gap-0.5 ${timeBlockBg} ${timeBlockText}`}
        >
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] opacity-80">
            {dayAbbr}
          </div>
          <div className="font-display font-[800] text-[23px] leading-[0.9] whitespace-nowrap tracking-[0.01em]">
            {timeDisplay}
          </div>
        </div>

        {/* Card body */}
        <div className="flex-1 min-w-0 px-[10px] py-[11px] flex flex-col gap-[3px]">
          {/* Kicker */}
          <div className={`font-mono text-[9px] font-bold uppercase tracking-[0.1em] truncate ${kickerCls}`}>
            {kickerText}
          </div>

          {/* Team 1 */}
          <div className="flex items-center gap-[7px]">
            {m.f1 && flagToIso(m.f1) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://flagcdn.com/w40/${flagToIso(m.f1).toLowerCase()}.png`}
                width={28} height={20} alt=""
                className="shrink-0 rounded-[2px] border border-hairline object-cover"
              />
            )}
            <span className={`font-display font-[800] text-[22px] uppercase tracking-[0.01em] leading-[0.9] flex-1 min-w-0 truncate ${nameColor(loser1)}`}>
              {m.t1}
            </span>
            {s1 && (
              <span className={`font-display font-[800] text-[23px] leading-[0.9] shrink-0 ${nameColor(loser1)}`}>
                {s1}
              </span>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex items-center gap-[7px]">
            {m.f2 && flagToIso(m.f2) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://flagcdn.com/w40/${flagToIso(m.f2).toLowerCase()}.png`}
                width={28} height={20} alt=""
                className="shrink-0 rounded-[2px] border border-hairline object-cover"
              />
            )}
            <span className={`font-display font-[800] text-[22px] uppercase tracking-[0.01em] leading-[0.9] flex-1 min-w-0 truncate ${nameColor(loser2)}`}>
              {m.t2}
            </span>
            {s2 && (
              <span className={`font-display font-[800] text-[23px] leading-[0.9] shrink-0 ${nameColor(loser2)}`}>
                {s2}
              </span>
            )}
          </div>

          {/* Badges */}
          {(live || m.done) && (
            <div className="flex gap-[5px] mt-0.5">
              {live && (
                <span className="font-mono text-[8.5px] font-bold uppercase tracking-[0.1em] px-[6px] py-0.5 rounded-[3px] bg-vermilion text-white">
                  EN VIVO
                </span>
              )}
              {m.done && (
                <span className="font-mono text-[8.5px] font-bold uppercase tracking-[0.1em] px-[6px] py-0.5 rounded-[3px] bg-muted text-white">
                  FT
                </span>
              )}
            </div>
          )}

          {/* Venue (dashed divider) */}
          <div
            className={`border-t-[1.5px] border-dashed pt-[5px] mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.06em] truncate text-muted ${
              live ? "border-ink-2" : "border-hairline"
            }`}
          >
            {m.v}
          </div>
        </div>

        {/* Action buttons */}
        <div className="shrink-0 border-l-2 border-ink flex flex-col w-[46px]">
          <button
            onClick={() => onToggleStar(m.id)}
            className={`flex-1 flex items-center justify-center text-[16px] border-b-2 border-ink transition-colors cursor-pointer ${
              starred ? "bg-gold-soft" : "hover:bg-gold-soft"
            }`}
          >
            {starred ? "★" : "☆"}
          </button>
          <button
            onClick={() => !m.done && onAddCal(m.id)}
            disabled={m.done}
            className={`flex-1 flex items-center justify-center text-[14px] transition-colors ${
              calDone
                ? "bg-[#E8F4E8]"
                : m.done
                ? "opacity-30 cursor-default"
                : "hover:bg-[#D6E0FA] cursor-pointer"
            }`}
          >
            {calDone ? "✅" : "📅"}
          </button>
        </div>
      </div>
    </div>
  );
}
