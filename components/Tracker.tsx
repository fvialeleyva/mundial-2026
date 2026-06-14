"use client";

import { useState, useEffect, useCallback } from "react";
import { MATCHES, STAGE_NAMES } from "@/lib/matches";
import { limaDateKey, todayKey, dayLabel, gcalDate } from "@/lib/timezone";
import MatchCard from "./MatchCard";
import AuthButton from "./AuthButton";
import { createClient } from "@/lib/supabase/client";
import { Match } from "@/types";
import { User } from "@supabase/supabase-js";

type Tab = "hoy" | "todos" | "lista";

function groupByDay(matches: Match[]) {
  const groups: Record<string, Match[]> = {};
  for (const m of matches) {
    const k = limaDateKey(m.u);
    if (!groups[k]) groups[k] = [];
    groups[k].push(m);
  }
  return groups;
}

function DayGroup({ dateKey, matches, stars, calDone, onToggleStar, onAddCal }: {
  dateKey: string;
  matches: Match[];
  stars: Record<number, boolean>;
  calDone: Record<number, boolean>;
  onToggleStar: (id: number) => void;
  onAddCal: (id: number) => void;
}) {
  const isToday = dateKey === todayKey();
  const sorted = [...matches].sort((a, b) => new Date(a.u).getTime() - new Date(b.u).getTime());
  return (
    <div className="mb-5">
      <div className={`text-xs font-bold uppercase tracking-widest pb-2 border-b border-espresso-border mb-2.5 ${isToday ? "text-verde" : "text-muted"}`}>
        {dayLabel(sorted[0].u, isToday)}
      </div>
      {sorted.map(m => (
        <MatchCard
          key={m.id}
          match={m}
          starred={!!stars[m.id]}
          calDone={!!calDone[m.id]}
          onToggleStar={onToggleStar}
          onAddCal={onAddCal}
        />
      ))}
    </div>
  );
}

export default function Tracker() {
  const [tab, setTab] = useState<Tab>("hoy");
  const [stageFilter, setStageFilter] = useState(-1);
  const [stars, setStars] = useState<Record<number, boolean>>({});
  const [calDone, setCalDone] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [, forceUpdate] = useState(0);

  const supabase = createClient();

  // Auth listener
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load watchlist — Supabase si hay usuario, localStorage si no
  useEffect(() => {
    if (user) {
      supabase
        .from("watchlist")
        .select("match_id, google_event_id")
        .eq("user_id", user.id)
        .then(({ data }) => {
          if (!data) return;
          const s: Record<number, boolean> = {};
          const c: Record<number, boolean> = {};
          data.forEach(row => {
            s[row.match_id] = true;
            if (row.google_event_id) c[row.match_id] = true;
          });
          setStars(s);
          setCalDone(c);
        });
    } else {
      setStars(JSON.parse(localStorage.getItem("wc26_stars") || "{}"));
      setCalDone(JSON.parse(localStorage.getItem("wc26_cal") || "{}"));
    }
  }, [user]);

  // Re-render every 30s to update live status
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

    // Optimistic update
    setStars(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id]; else next[id] = true;
      if (!user) localStorage.setItem("wc26_stars", JSON.stringify(next));
      return next;
    });

    if (user) {
      if (isStarred) {
        await supabase.from("watchlist").delete().eq("user_id", user.id).eq("match_id", id);
      } else {
        await supabase.from("watchlist").upsert({ user_id: user.id, match_id: id });
      }
    }
  }, [stars, user]);

  const addCal = useCallback(async (id: number) => {
    const m = MATCHES.find(x => x.id === id);
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
      await supabase.from("watchlist").upsert({
        user_id: user.id,
        match_id: id,
        google_event_id: `gcal-${id}`,
      });
    }

    showToast("📅 Abriendo Google Calendar…");
  }, [user, showToast]);

  // Stats
  const today = todayKey();
  const todayMatches = MATCHES.filter(m => limaDateKey(m.u) === today);
  const starCount = MATCHES.filter(m => stars[m.id] && !m.done).length;
  const remaining = MATCHES.filter(m => !m.done).length;

  // Matches to show per tab
  let matchList: Match[] = [];
  if (tab === "hoy")   matchList = todayMatches;
  if (tab === "todos") matchList = stageFilter >= 0 ? MATCHES.filter(m => m.s === stageFilter) : MATCHES;
  if (tab === "lista") matchList = MATCHES.filter(m => stars[m.id]);

  const groups = groupByDay(matchList);

  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-br from-[#110D06] via-[#1D1409] to-espresso-light border-b border-espresso-border px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <span className="text-3xl">⚽</span>
          <div className="flex-1">
            <div className="text-xl font-extrabold tracking-tight text-crema">Mundial 2026</div>
            <div className="text-xs text-muted mt-0.5">
              <span className="inline-block w-2 h-2 bg-verde rounded-full mr-1.5 animate-blink" />
              USA · México · Canadá &nbsp;·&nbsp; 11 Jun – 19 Jul &nbsp;·&nbsp; Hora Lima (UTC-5)
            </div>
          </div>
          <AuthButton />
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-espresso-light border-b border-espresso-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex px-5">
          {(["hoy", "todos", "lista"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                "px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap",
                tab === t
                  ? "text-verde border-verde"
                  : "text-muted border-transparent hover:text-crema hover:bg-espresso-medium",
              ].join(" ")}
            >
              {t === "hoy" ? "🏟️ Hoy" : t === "todos" ? "📅 Todos" : "⭐ Mi Lista"}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-2xl mx-auto w-full px-4 py-4 flex-1">
        {/* Stats */}
        <div className="grid grid-cols-3 rounded-xl overflow-hidden border border-espresso-border mb-4">
          {[
            { n: todayMatches.length, l: "Hoy" },
            { n: starCount,           l: "Mi lista" },
            { n: remaining,           l: "Quedan" },
          ].map(({ n, l }, i) => (
            <div key={i} className="text-center py-3 px-2 bg-espresso-light border-r border-espresso-border last:border-r-0">
              <div className="text-2xl font-extrabold text-verde leading-none">{n}</div>
              <div className="text-[10px] text-muted uppercase tracking-widest mt-1">{l}</div>
            </div>
          ))}
        </div>

        {/* Login prompt si no hay usuario */}
        {!user && (
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4 border border-espresso-border bg-espresso-light text-xs text-muted">
            <span>🔑</span>
            <span>Entra con Google para sincronizar tu lista entre dispositivos</span>
          </div>
        )}

        {/* Stage filter (tab Todos) */}
        {tab === "todos" && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {[{ label: "Todos", val: -1 }, ...STAGE_NAMES.map((n, i) => ({ label: n, val: i }))].map(({ label, val }) => (
              <button
                key={val}
                onClick={() => setStageFilter(val)}
                className={[
                  "px-3 py-1 rounded-full border text-xs font-semibold transition-colors cursor-pointer",
                  stageFilter === val
                    ? "bg-verde text-espresso border-verde"
                    : "border-espresso-border text-muted hover:border-verde hover:text-verde",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Today banner */}
        {tab === "hoy" && (() => {
          const starredToday = todayMatches.filter(m => stars[m.id]);
          if (!starredToday.length) return null;
          return (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4 border border-naranja/30 bg-naranja/10">
              <span className="text-3xl">📺</span>
              <div>
                <div className="text-sm font-bold text-naranja">
                  Tienes {starredToday.length} partido{starredToday.length > 1 ? "s" : ""} marcado{starredToday.length > 1 ? "s" : ""} hoy
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {starredToday.map(m => `${m.t1} vs ${m.t2}`).join(" · ")}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Match list */}
        {Object.keys(groups).length === 0 ? (
          <div className="text-center py-16 text-muted">
            <div className="text-5xl mb-4">
              {tab === "lista" ? "☆" : tab === "hoy" ? "😴" : "🔍"}
            </div>
            <p className="text-sm">
              {tab === "lista"
                ? "Marca partidos con ☆ Ver para agregarlos a tu lista"
                : tab === "hoy"
                ? "No hay partidos hoy"
                : "Sin partidos"}
            </p>
          </div>
        ) : (
          Object.keys(groups).sort().map(k => (
            <DayGroup
              key={k}
              dateKey={k}
              matches={groups[k]}
              stars={stars}
              calDone={calDone}
              onToggleStar={toggleStar}
              onAddCal={addCal}
            />
          ))
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className={[
          "fixed bottom-5 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-sm font-semibold border shadow-lg z-50 whitespace-nowrap",
          toast.ok
            ? "bg-verde-dim border-verde text-white"
            : "bg-red-900 border-rojo text-white",
        ].join(" ")}>
          {toast.msg}
        </div>
      )}
    </>
  );
}
