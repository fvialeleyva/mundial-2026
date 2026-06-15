"use client";

import { useState, useEffect, useCallback } from "react";
import { MATCHES, STAGE_NAMES } from "@/lib/matches";
import { limaDateKey, todayKey, dayLabel, gcalDate, isLive, isPast } from "@/lib/timezone";
import MatchCard from "./MatchCard";
import AuthButton from "./AuthButton";
import { createClient } from "@/lib/supabase/client";
import { Match } from "@/types";
import { User } from "@supabase/supabase-js";

type Tab = "hoy" | "todos" | "lista";

const STAGE_DISPLAY = [
  "Fase de Grupos", "Ronda de 32", "Octavos de Final",
  "Cuartos de Final", "Semifinal", "3.er Puesto", "★ La Final",
];

// Colors used for stage headers via inline style (avoids Tailwind JIT missing dynamic classes)
const STAGE_HEADER_COLOR = [
  "#1B1714", "#2B53C2", "#2B53C2", "#2B53C2", "#B5860F", "#B5860F", "#B5860F",
];

function groupByDay(matches: Match[]) {
  const groups: Record<string, Match[]> = {};
  for (const m of matches) {
    const k = limaDateKey(m.u);
    if (!groups[k]) groups[k] = [];
    groups[k].push(m);
  }
  return groups;
}

function groupByStage(matches: Match[]) {
  const groups: Record<number, Match[]> = {};
  for (const m of matches) {
    if (!groups[m.s]) groups[m.s] = [];
    groups[m.s].push(m);
  }
  return groups;
}

function sortedByTime(matches: Match[]) {
  return [...matches].sort((a, b) => new Date(a.u).getTime() - new Date(b.u).getTime());
}

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-[10px] mt-[14px] mb-[10px]">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] shrink-0" style={{ color }}>
        {label}
      </span>
      <div className="flex-1 h-[2px] opacity-30" style={{ background: color }} />
    </div>
  );
}

function DayHeader({ dateKey, firstMatchUtc }: { dateKey: string; firstMatchUtc: string }) {
  const isToday = dateKey === todayKey();
  return (
    <div
      className={`font-mono text-[10px] font-bold uppercase tracking-[0.1em] py-[14px] pb-2 border-b border-dashed border-hairline mb-[10px] ${
        isToday ? "text-ink" : "text-muted"
      }`}
    >
      {dayLabel(firstMatchUtc, isToday)}
    </div>
  );
}

function EmptyState({ icon, title, copy, cta, onCta }: {
  icon: string; title: string; copy: string; cta: string; onCta: () => void;
}) {
  return (
    <div className="flex flex-col items-center pt-12 pb-8 gap-[14px] text-center">
      <div
        className="w-[118px] h-[118px] rounded-full border-[3px] border-ink flex items-center justify-center text-[36px] mb-2"
        style={{ boxShadow: "0 0 0 8px #F2ECDF, 0 0 0 11px #1B1714, 0 0 0 22px #F2ECDF, 0 0 0 25px #D8CDB7" }}
      >
        {icon}
      </div>
      <div
        className="font-display font-[900] text-[30px] uppercase leading-[0.85]"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <div className="text-[14px] text-muted leading-relaxed max-w-[240px]">{copy}</div>
      <button
        onClick={onCta}
        className="font-display font-[800] text-[17px] uppercase tracking-[0.03em] bg-cobalt text-cream border-[2.5px] border-ink rounded-[6px] px-[22px] py-[11px] cursor-pointer shadow-hard-ink hover:bg-[#1E3E9C] transition-colors"
      >
        {cta}
      </button>
    </div>
  );
}

export default function Tracker({ overrides = {} }: { overrides?: Record<number, Partial<Match>> }) {
  const allMatches = MATCHES.map(m => ({ ...m, ...(overrides[m.id] ?? {}) }));
  const [tab, setTab] = useState<Tab>("hoy");
  const [stageFilter, setStageFilter] = useState(-1);
  const [stars, setStars] = useState<Record<number, boolean>>({});
  const [calDone, setCalDone] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [, forceUpdate] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      supabase.from("watchlist").select("match_id, google_event_id").eq("user_id", user.id)
        .then(({ data }) => {
          if (!data) return;
          const s: Record<number, boolean> = {};
          const c: Record<number, boolean> = {};
          data.forEach(row => {
            s[row.match_id] = true;
            if (row.google_event_id) c[row.match_id] = true;
          });
          setStars(s); setCalDone(c);
        });
    } else {
      setStars(JSON.parse(localStorage.getItem("wc26_stars") || "{}"));
      setCalDone(JSON.parse(localStorage.getItem("wc26_cal") || "{}"));
    }
  }, [user]);

  useEffect(() => {
    const t = setInterval(() => forceUpdate(n => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const toggleStar = useCallback(async (id: number) => {
    const isStarred = !!stars[id];
    setStars(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id]; else next[id] = true;
      if (!user) localStorage.setItem("wc26_stars", JSON.stringify(next));
      return next;
    });
    if (user) {
      if (isStarred) await supabase.from("watchlist").delete().eq("user_id", user.id).eq("match_id", id);
      else await supabase.from("watchlist").upsert({ user_id: user.id, match_id: id });
    }
  }, [stars, user]);

  const addCal = useCallback(async (id: number) => {
    const m = allMatches.find(x => x.id === id);
    if (!m) return;
    const title = m.f1
      ? `⚽ ${m.t1} ${m.f1} vs ${m.f2} ${m.t2} — Mundial 2026`
      : `⚽ ${m.t1} vs ${m.t2} — ${STAGE_NAMES[m.s]}`;
    const desc = `${STAGE_NAMES[m.s]}${m.g ? ` · Grupo ${m.g}` : ""} · ${m.v}\nMundial 2026 — USA/México/Canadá`;
    const endU = new Date(new Date(m.u).getTime() + 2 * 3600_000).toISOString();
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${gcalDate(m.u)}/${gcalDate(endU)}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(m.v)}`;
    window.open(url, "_blank");
    setCalDone(prev => {
      const next = { ...prev, [id]: true };
      if (!user) localStorage.setItem("wc26_cal", JSON.stringify(next));
      return next;
    });
    if (user) {
      await supabase.from("watchlist").upsert({ user_id: user.id, match_id: id, google_event_id: `gcal-${id}` });
    }
    showToast("📅 Abriendo Google Calendar…");
  }, [user, showToast]);

  // Derived values
  const today = todayKey();
  const todayMatches = allMatches.filter(m => limaDateKey(m.u) === today);
  const starCount  = allMatches.filter(m => stars[m.id] && !m.done).length;
  const remaining  = allMatches.filter(m => !m.done).length;

  const liveToday     = todayMatches.filter(m => isLive(m.u, m.done));
  const upcomingToday = todayMatches.filter(m => !m.done && !isLive(m.u, m.done) && !isPast(m.u));
  const doneToday     = todayMatches.filter(m => m.done || (isPast(m.u) && !isLive(m.u, m.done)));

  const todayDateStr = new Date().toLocaleDateString("es-PE", {
    timeZone: "America/Lima", weekday: "short", day: "numeric", month: "short",
  });

  const cardProps = (m: Match) => ({
    match: m,
    starred: !!stars[m.id],
    calDone: !!calDone[m.id],
    onToggleStar: toggleStar,
    onAddCal: addCal,
  });

  const NAV_ITEMS: { t: Tab; glyph: string; label: string }[] = [
    { t: "hoy",   glyph: "◉",                       label: "HOY"     },
    { t: "todos", glyph: "▦",                       label: "TODOS"   },
    { t: "lista", glyph: starCount > 0 ? "★" : "☆", label: "MI LISTA" },
  ];

  return (
    <div className="max-w-2xl mx-auto min-h-screen flex flex-col bg-paper text-ink">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-10 bg-card border-b-[2.5px] border-ink px-4 py-[13px] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-[9px]">
          <div
            className="w-[26px] h-[26px] bg-ink rounded-full shrink-0"
            style={{ boxShadow: "inset 0 0 0 4px #FCF8EE, inset 0 0 0 6px #1B1714" }}
          />
          <div className="font-display font-[900] text-[23px] uppercase tracking-[0.02em] leading-[0.9]">
            Mundial &#x27;26
          </div>
        </div>

        {/* Desktop nav — hidden on mobile */}
        <div className="hidden md:flex items-center border-2 border-ink rounded-[6px] overflow-hidden">
          {NAV_ITEMS.map(({ t, glyph, label }) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                "px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em]",
                "border-r-2 border-ink last:border-r-0 transition-colors cursor-pointer",
                tab === t ? "bg-ink text-cream" : "text-muted-2 hover:bg-card-2 hover:text-ink",
              ].join(" ")}
            >
              {glyph} {label}
            </button>
          ))}
        </div>

        <AuthButton />
      </header>

      {/* ── CONTENT ── */}
      <main className="flex-1 px-4 pt-4 pb-24 md:pb-8">

        {/* ════ HOY ════ */}
        {tab === "hoy" && (
          <>
            {/* Date heading */}
            <div className="flex items-baseline justify-between mb-[14px]">
              <div className="font-display font-[900] text-[40px] uppercase leading-[0.85] tracking-[0.01em]">HOY</div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{todayDateStr}</div>
            </div>

            {/* Stats bar */}
            <div className="flex border-2 border-ink rounded-[6px] overflow-hidden mb-[14px]">
              <div className="flex-1 py-[10px] px-2 text-center bg-ink border-r-2 border-ink">
                <div className="font-display font-[800] text-[28px] leading-[0.9] text-cream">{todayMatches.length}</div>
                <div className="font-mono text-[8.5px] font-bold uppercase tracking-[0.1em] text-muted-2 mt-[3px]">Hoy</div>
              </div>
              <div className="flex-1 py-[10px] px-2 text-center border-r-2 border-ink">
                <div className="font-display font-[800] text-[28px] leading-[0.9] text-gold-t">{starCount}</div>
                <div className="font-mono text-[8.5px] font-bold uppercase tracking-[0.1em] text-muted mt-[3px]">Guardados</div>
              </div>
              <div className="flex-1 py-[10px] px-2 text-center">
                <div className="font-display font-[800] text-[28px] leading-[0.9] text-cobalt">{remaining}</div>
                <div className="font-mono text-[8.5px] font-bold uppercase tracking-[0.1em] text-muted mt-[3px]">Faltan</div>
              </div>
            </div>

            {/* EN VIVO AHORA */}
            {liveToday.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-[10px]">
                  <div className="relative w-[9px] h-[9px] shrink-0">
                    <div className="absolute inset-0 w-[9px] h-[9px] bg-vermilion rounded-full animate-livedot z-10" />
                    <div className="absolute -top-1 -left-1 w-[17px] h-[17px] border-2 border-vermilion rounded-full animate-livering" />
                  </div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-vermilion">
                    EN VIVO AHORA
                  </span>
                  <div className="flex-1 h-[1.5px] bg-vermilion opacity-40" />
                </div>
                {sortedByTime(liveToday).map(m => <MatchCard key={m.id} {...cardProps(m)} />)}
              </>
            )}

            {/* Próximos hoy */}
            {upcomingToday.length > 0 && (
              <>
                <SectionHeader label="Próximos hoy" color="#1B1714" />
                {sortedByTime(upcomingToday).map(m => <MatchCard key={m.id} {...cardProps(m)} />)}
              </>
            )}

            {/* Finalizados hoy */}
            {doneToday.length > 0 && (
              <>
                <SectionHeader label="Finalizados" color="#7A7060" />
                {sortedByTime(doneToday).map(m => <MatchCard key={m.id} {...cardProps(m)} />)}
              </>
            )}

            {/* No hay partidos hoy */}
            {todayMatches.length === 0 && (
              <EmptyState
                icon="⚽"
                title="Sin partidos<br/>hoy"
                copy="Revisa la pestaña Todos para ver todos los partidos del torneo."
                cta="Ver todos los partidos →"
                onCta={() => setTab("todos")}
              />
            )}
          </>
        )}

        {/* ════ TODOS ════ */}
        {tab === "todos" && (
          <>
            {/* Phase filter pills */}
            <div className="flex gap-[7px] mb-[14px] overflow-x-auto pb-1 scrollbar-none">
              {[{ label: "Todos", val: -1 }, ...STAGE_NAMES.map((n, i) => ({ label: n, val: i }))].map(({ label, val }) => (
                <button
                  key={val}
                  onClick={() => setStageFilter(val)}
                  className={[
                    "font-mono text-[10px] font-bold uppercase tracking-[0.08em] px-[14px] py-[6px]",
                    "border-2 border-ink rounded-[20px] whitespace-nowrap transition-colors cursor-pointer shrink-0",
                    stageFilter === val ? "bg-ink text-cream" : "bg-transparent text-ink hover:bg-card-2",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Filtered: group by day */}
            {stageFilter >= 0 && (() => {
              const list = allMatches.filter(m => m.s === stageFilter);
              const dayGroups = groupByDay(list);
              return Object.keys(dayGroups).sort().map(k => {
                const ms = sortedByTime(dayGroups[k]);
                return (
                  <div key={k}>
                    <DayHeader dateKey={k} firstMatchUtc={ms[0].u} />
                    {ms.map(m => <MatchCard key={m.id} {...cardProps(m)} />)}
                  </div>
                );
              });
            })()}

            {/* All: group by stage */}
            {stageFilter < 0 && (() => {
              const stageGroups = groupByStage(allMatches);
              return Object.keys(stageGroups)
                .map(Number)
                .sort((a, b) => a - b)
                .map(s => {
                  const ms = sortedByTime(stageGroups[s]);
                  return (
                    <div key={s}>
                      <SectionHeader label={STAGE_DISPLAY[s]} color={STAGE_HEADER_COLOR[s]} />
                      {ms.map(m => <MatchCard key={m.id} {...cardProps(m)} />)}
                    </div>
                  );
                });
            })()}
          </>
        )}

        {/* ════ MI LISTA ════ */}
        {tab === "lista" && (() => {
          const myMs = allMatches.filter(m => stars[m.id]);
          if (myMs.length === 0) {
            return (
              <EmptyState
                icon="☆"
                title="Aún no<br/>guardas nada"
                copy="Toca ☆ en cualquier partido para guardarlo aquí y compartirlo con el grupo."
                cta="Ver partidos de hoy →"
                onCta={() => setTab("hoy")}
              />
            );
          }
          const dayGroups = groupByDay(myMs);
          return (
            <>
              <div className="flex items-center gap-2 mb-[14px]">
                <span className="font-display font-[900] text-[22px] uppercase tracking-[0.01em] text-gold-t">
                  ★ {myMs.length}
                </span>
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
                  guardado{myMs.length > 1 ? "s" : ""}
                </span>
              </div>
              {Object.keys(dayGroups).sort().map(k => {
                const ms = sortedByTime(dayGroups[k]);
                return (
                  <div key={k}>
                    <DayHeader dateKey={k} firstMatchUtc={ms[0].u} />
                    {ms.map(m => <MatchCard key={m.id} {...cardProps(m)} />)}
                  </div>
                );
              })}
            </>
          );
        })()}
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-card border-t-[2.5px] border-ink flex z-50">
        {NAV_ITEMS.map(({ t, glyph, label }) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "flex-1 flex flex-col items-center pt-[10px] pb-3 gap-[3px]",
              "cursor-pointer border-0 bg-transparent transition-colors relative",
              tab === t ? "text-ink" : "text-muted-2 hover:text-muted",
            ].join(" ")}
          >
            {tab === t && (
              <div
                className="absolute top-0 left-3 right-3 h-1 rounded-b-sm"
                style={{ background: t === "lista" ? "#D69A2C" : "#1B1714" }}
              />
            )}
            <span className="text-[16px] leading-none">{glyph}</span>
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.08em]">{label}</span>
          </button>
        ))}
      </nav>

      {/* ── TOAST ── */}
      {toast && (
        <div
          className={[
            "fixed bottom-[80px] md:bottom-5 left-1/2 -translate-x-1/2",
            "px-5 py-2.5 rounded-[6px] font-mono text-[12px] font-bold",
            "border-2 border-ink z-[60] whitespace-nowrap shadow-hard-ink",
            toast.ok ? "bg-cobalt text-cream" : "bg-vermilion text-cream",
          ].join(" ")}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
