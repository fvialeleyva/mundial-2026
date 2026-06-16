"use client";

import { createClient } from "@/lib/supabase/client";
import { Match } from "@/types";
import { limaTime, isLive } from "@/lib/timezone";
import { STAGE_NAMES } from "@/lib/matches";

function flagToIso(flag: string): string {
  const cps = [...flag].map(c => c.codePointAt(0)!);
  if (cps.length === 2 && cps[0] >= 0x1F1E6 && cps[0] <= 0x1F1FF) {
    return String.fromCharCode(cps[0] - 0x1F1E6 + 65) +
           String.fromCharCode(cps[1] - 0x1F1E6 + 65);
  }
  return "";
}

function Flag({ emoji, size = 26 }: { emoji: string; size?: number }) {
  const iso = flagToIso(emoji);
  if (!iso) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${iso.toLowerCase()}.png`}
      width={size} height={Math.round(size * 0.72)} alt=""
      style={{ borderRadius: 2, border: "1px solid rgba(0,0,0,0.12)", objectFit: "cover", flexShrink: 0 }}
    />
  );
}

function TeamRow({ flag, name, score, live }: { flag: string; name: string; score?: string; live?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <Flag emoji={flag} />
      <span style={{
        fontFamily: "'Big Shoulders Display',sans-serif", fontWeight: 800,
        fontSize: 22, textTransform: "uppercase", lineHeight: 0.85,
        flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        color: live ? "#FBF6EA" : "#1B1714",
      }}>{name}</span>
      {score && (
        <span style={{ fontFamily: "'Big Shoulders Display',sans-serif", fontWeight: 900, fontSize: 23, color: live ? "#FBF6EA" : "#1B1714", flexShrink: 0 }}>{score}</span>
      )}
    </div>
  );
}

function PreviewCardLive({ match }: { match: Match }) {
  return (
    <div style={{
      display: "flex", alignItems: "stretch", background: "#16130E",
      border: "2.5px solid #1B1714", borderRadius: 8, overflow: "hidden",
      boxShadow: "4px 4px 0 #E04127",
    }}>
      <div style={{ background: "#E04127", color: "#FBF6EA", padding: "12px 11px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", flexShrink: 0, minWidth: 82, borderRight: "2.5px solid #1B1714" }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, letterSpacing: "0.12em", fontWeight: 700 }}>EN VIVO</div>
        <div style={{ fontFamily: "'Big Shoulders Display',sans-serif", fontWeight: 900, fontSize: 27, lineHeight: 1, marginTop: 1 }}>73&apos;</div>
      </div>
      <div style={{ flex: 1, padding: "11px 12px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 7, minWidth: 0 }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.1em", color: "#9A8C76", textTransform: "uppercase" }}>
          {STAGE_NAMES[match.s]}{match.g ? ` · Grupo ${match.g}` : ""} · {match.v.split(",")[0]}
        </div>
        <TeamRow flag={match.f1} name={match.t1} score="1" live />
        <TeamRow flag={match.f2} name={match.t2} score="1" live />
      </div>
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, borderLeft: "2px solid #2C261D" }}>
        <button style={{ flex: 1, width: 46, border: "none", borderBottom: "2px solid #2C261D", background: "#221D16", fontSize: 14, cursor: "default", color: "#6B5E4A" }}>🔒</button>
        <button style={{ flex: 1, width: 46, border: "none", background: "#E04127", fontSize: 15, cursor: "default", color: "#FBF6EA" }}>▶</button>
      </div>
    </div>
  );
}

function PreviewCardUpcoming({ match }: { match: Match }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", background: "#FCF8EE", border: "2.5px solid #1B1714", borderRadius: 7, overflow: "hidden" }}>
      <div style={{ background: "#1B1714", color: "#FBF6EA", padding: "12px 11px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", flexShrink: 0, minWidth: 82, borderRight: "2.5px solid #1B1714" }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.1em", opacity: 0.7 }}>HOY</div>
        <div style={{ fontFamily: "'Big Shoulders Display',sans-serif", fontWeight: 800, fontSize: 23, lineHeight: 1, marginTop: 1, whiteSpace: "nowrap" }}>{limaTime(match.u)}</div>
      </div>
      <div style={{ flex: 1, padding: "11px 12px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 7, minWidth: 0 }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.1em", color: "#2B53C2", textTransform: "uppercase", fontWeight: 700 }}>
          {STAGE_NAMES[match.s]}{match.g ? ` · Grupo ${match.g}` : ""} · {match.v.split(",")[0]}
        </div>
        <TeamRow flag={match.f1} name={match.t1} />
        <TeamRow flag={match.f2} name={match.t2} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, borderLeft: "2px solid #1B1714" }}>
        <button style={{ flex: 1, width: 46, border: "none", borderBottom: "2px solid #1B1714", background: "#FCF8EE", fontSize: 14, cursor: "default", color: "#A89A82" }}>🔒</button>
        <button style={{ flex: 1, width: 46, border: "none", background: "#FCF8EE", fontSize: 14, cursor: "default", color: "#A89A82" }}>🔒</button>
      </div>
    </div>
  );
}

export default function Landing({ todayMatches }: { todayMatches: Match[] }) {
  const supabase = createClient();

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar.events",
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  };

  const liveMatch = todayMatches.find(m => isLive(m.u, m.done));
  const upcoming  = todayMatches.filter(m => !isLive(m.u, m.done) && !m.done);
  const previewA  = liveMatch ?? upcoming[0];
  const previewB  = upcoming[liveMatch ? 0 : 1];

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-8 px-4">
      <div className="w-full max-w-md border-[3px] border-ink rounded-[20px] overflow-hidden shadow-[6px_6px_0_rgba(27,23,20,0.16)]">

        {/* HERO */}
        <div style={{ position: "relative", background: "#1B1714", color: "#FBF6EA", padding: "22px 22px 30px", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(240,232,212,0.10) 1px, transparent 1.4px)", backgroundSize: "11px 11px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 7, background: "repeating-linear-gradient(45deg,#E04127 0 8px,#1B1714 8px 16px)" }} />
          <div style={{ position: "absolute", top: -32, right: -32, width: 150, height: 150, borderRadius: "50%", border: "2px solid rgba(214,154,44,0.55)", boxShadow: "inset 0 0 0 14px transparent, inset 0 0 0 16px rgba(214,154,44,0.4), inset 0 0 0 34px transparent, inset 0 0 0 36px rgba(214,154,44,0.28)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase font-bold mb-4" style={{ color: "#D69A2C" }}>
              11 Jun — 19 Jul · 104 partidos
            </div>
            <div className="font-display font-[900] text-[clamp(48px,13vw,62px)] uppercase leading-[0.82] tracking-[0.01em]">Mundial</div>
            <div className="font-display font-[900] text-[clamp(48px,13vw,62px)] uppercase leading-[0.82] tracking-[0.04em]" style={{ color: "#D69A2C", WebkitTextStroke: "1.5px #1B1714" }}>2026</div>
            <div className="flex items-center gap-[9px] mt-[14px]">
              <span className="text-xl">🇺🇸</span>
              <span className="text-xl">🇲🇽</span>
              <span className="text-xl">🇨🇦</span>
              <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase" style={{ color: "#9A8C76" }}>USA · México · Canadá</span>
            </div>
          </div>
        </div>

        {/* INTRO + CTA */}
        <div className="bg-paper px-[18px] pt-5 pb-4 flex flex-col gap-[15px]">
          <div className="font-display font-[800] text-[clamp(20px,6vw,25px)] uppercase leading-[0.98]">
            Tu Mundial, en tu hora.<br />
            <span style={{ color: "#A8452C" }}>Con tu gente.</span>
          </div>
          <p className="text-[14px] leading-relaxed text-muted">
            Todos los partidos en tu zona horaria. Marca tus favoritos con{" "}
            <span className="text-gold-t font-bold">★</span>{" "}
            y agrégalos a tu calendario con un toque.
          </p>
          <button
            onClick={signIn}
            className="flex items-center justify-center gap-[11px] w-full border-[2.5px] border-ink bg-card rounded-[7px] p-[14px] cursor-pointer shadow-hard-ink hover:bg-white transition-colors"
          >
            <span className="w-6 h-6 rounded-full border-2 border-ink bg-cobalt text-cream flex items-center justify-center font-display font-[900] text-[15px]">G</span>
            <span className="font-display font-[800] text-[19px] tracking-[0.02em] uppercase text-ink">Entrar con Google</span>
          </button>
          <p className="text-center font-mono text-[10px] tracking-[0.04em] text-muted-2 -mt-1">
            Guardar y sincronizar requiere entrar · Gratis
          </p>
        </div>

        {/* PREVIEW */}
        {(previewA || previewB) && (
          <div className="bg-paper px-[18px] pb-5 flex flex-col gap-[13px]">
            <div className="flex items-center gap-2">
              <span className="relative w-[9px] h-[9px] inline-flex items-center justify-center">
                <span className="animate-livering absolute w-[9px] h-[9px] rounded-full bg-vermilion" />
                <span className="animate-livedot w-[8px] h-[8px] rounded-full bg-vermilion" />
              </span>
              <span className="font-mono font-bold text-[10px] tracking-[0.14em] uppercase" style={{ color: "#A8452C" }}>
                {liveMatch ? "En vivo · sin entrar" : "Hoy · sin entrar"}
              </span>
              <span className="flex-1 h-[2px] bg-ink" />
            </div>

            {previewA && (liveMatch
              ? <PreviewCardLive match={previewA} />
              : <PreviewCardUpcoming match={previewA} />
            )}
            {previewB && <PreviewCardUpcoming match={previewB} />}

            <button
              onClick={signIn}
              className="flex items-center justify-center gap-2 w-full rounded-[7px] p-3 cursor-pointer hover:border-ink transition-colors"
              style={{ border: "2px dashed #B3A88E", background: "transparent" }}
            >
              <span className="font-mono font-bold text-[12px] tracking-[0.06em] uppercase text-muted">
                Ver los 104 partidos →
              </span>
            </button>
          </div>
        )}

        {/* FOOTER STATS */}
        <div className="flex border-t-[2.5px] border-ink bg-ink">
          {[
            { n: "104", label: "Partidos", color: "#FBF6EA" },
            { n: "16",  label: "Sedes",    color: "#D69A2C" },
            { n: "3",   label: "Países",   color: "#FBF6EA" },
          ].map(({ n, label, color }, i) => (
            <div key={i} className={`flex-1 py-[14px] px-[6px] text-center ${i < 2 ? "border-r-2 border-ink-2" : ""}`}>
              <div className="font-display font-[800] text-[24px] leading-[0.9]" style={{ color }}>{n}</div>
              <div className="font-mono text-[8.5px] tracking-[0.08em] text-muted-2 uppercase mt-[2px]">{label}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
