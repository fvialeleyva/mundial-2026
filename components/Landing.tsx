"use client";

import { createClient } from "@/lib/supabase/client";
import { Match } from "@/types";
import { limaTime, isLive } from "@/lib/timezone";
import { STAGE_NAMES } from "@/lib/matches";

function PreviewCard({ match, forceState }: { match: Match; forceState?: "live" | "upcoming" }) {
  const live = forceState === "live" || isLive(match.u, match.done);

  if (live) {
    return (
      <div style={{
        display: "flex", alignItems: "stretch", background: "#16130E",
        border: "2.5px solid #1B1714", borderRadius: 8, overflow: "hidden",
        boxShadow: "4px 4px 0 #E04127",
      }}>
        {/* time block */}
        <div style={{
          background: "#E04127", color: "#FBF6EA", padding: "12px 11px",
          display: "flex", flexDirection: "column", justifyContent: "center",
          alignItems: "center", flexShrink: 0, minWidth: 82,
          borderRight: "2.5px solid #1B1714",
        }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, letterSpacing: "0.12em", fontWeight: 700 }}>EN VIVO</div>
          <div style={{ fontFamily: "'Big Shoulders Display',sans-serif", fontWeight: 900, fontSize: 27, lineHeight: 1, marginTop: 1 }}>73'</div>
        </div>
        {/* body */}
        <div style={{ flex: 1, padding: "11px 12px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 7, minWidth: 0 }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.1em", color: "#9A8C76", textTransform: "uppercase" }}>
            {STAGE_NAMES[match.s]}{match.g ? ` · Grupo ${match.g}` : ""} · {match.v.split(",")[0]}
          </div>
          {[{ f: match.f1, t: match.t1, s: "1" }, { f: match.f2, t: match.t2, s: "1" }].map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontSize: 23, lineHeight: 1 }}>{row.f}</span>
              <span style={{ fontFamily: "'Big Shoulders Display',sans-serif", fontWeight: 800, fontSize: 21, textTransform: "uppercase", lineHeight: 0.85, flex: 1, minWidth: 0, color: "#FBF6EA", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.t}</span>
              <span style={{ fontFamily: "'Big Shoulders Display',sans-serif", fontWeight: 900, fontSize: 23, color: "#FBF6EA", flexShrink: 0 }}>{row.s}</span>
            </div>
          ))}
        </div>
        {/* actions — locked */}
        <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, borderLeft: "2px solid #2C261D" }}>
          <button style={{ flex: 1, width: 46, border: "none", borderBottom: "2px solid #2C261D", background: "#221D16", fontSize: 14, cursor: "default", color: "#6B5E4A" }}>🔒</button>
          <button style={{ flex: 1, width: 46, border: "none", background: "#E04127", fontSize: 15, cursor: "default", color: "#FBF6EA" }}>▶</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "stretch", background: "#FCF8EE",
      border: "2.5px solid #1B1714", borderRadius: 7, overflow: "hidden",
    }}>
      {/* time block */}
      <div style={{
        background: "#1B1714", color: "#FBF6EA", padding: "12px 11px",
        display: "flex", flexDirection: "column", justifyContent: "center",
        alignItems: "center", flexShrink: 0, minWidth: 82,
        borderRight: "2.5px solid #1B1714",
      }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.1em", opacity: 0.7 }}>HOY</div>
        <div style={{ fontFamily: "'Big Shoulders Display',sans-serif", fontWeight: 800, fontSize: 23, lineHeight: 1, marginTop: 1, whiteSpace: "nowrap" }}>
          {limaTime(match.u)}
        </div>
      </div>
      {/* body */}
      <div style={{ flex: 1, padding: "11px 12px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 7, minWidth: 0 }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.1em", color: "#2B53C2", textTransform: "uppercase", fontWeight: 700 }}>
          {STAGE_NAMES[match.s]}{match.g ? ` · Grupo ${match.g}` : ""} · {match.v.split(",")[0]}
        </div>
        {[{ f: match.f1, t: match.t1 }, { f: match.f2, t: match.t2 }].map((row, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 23, lineHeight: 1 }}>{row.f}</span>
            <span style={{ fontFamily: "'Big Shoulders Display',sans-serif", fontWeight: 800, fontSize: 22, textTransform: "uppercase", lineHeight: 0.85, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.t}</span>
          </div>
        ))}
      </div>
      {/* actions — locked */}
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

  const liveMatch   = todayMatches.find(m => isLive(m.u, m.done));
  const upcoming    = todayMatches.filter(m => !isLive(m.u, m.done) && !m.done);
  const previewA    = liveMatch ?? upcoming[0];
  const previewB    = upcoming[liveMatch ? 0 : 1];

  return (
    <div style={{ padding: "34px 20px 60px", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      <div style={{
        width: "100%", maxWidth: 390, background: "#F2ECDF",
        border: "3px solid #1B1714", borderRadius: 20, overflow: "hidden",
        boxShadow: "6px 6px 0 rgba(27,23,20,0.16)",
        display: "flex", flexDirection: "column",
      }}>

        {/* HERO */}
        <div style={{ position: "relative", background: "#1B1714", color: "#FBF6EA", padding: "22px 22px 30px", overflow: "hidden", borderBottom: "3px solid #1B1714" }}>
          {/* halftone */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(240,232,212,0.10) 1px, transparent 1.4px)", backgroundSize: "11px 11px", pointerEvents: "none" }} />
          {/* diagonal stripe */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 7, background: "repeating-linear-gradient(45deg,#E04127 0 8px,#1B1714 8px 16px)" }} />
          {/* concentric rings */}
          <div style={{ position: "absolute", top: -32, right: -32, width: 150, height: 150, borderRadius: "50%", border: "2px solid rgba(214,154,44,0.55)", boxShadow: "inset 0 0 0 14px transparent, inset 0 0 0 16px rgba(214,154,44,0.4), inset 0 0 0 34px transparent, inset 0 0 0 36px rgba(214,154,44,0.28)", pointerEvents: "none" }} />

          <div style={{ position: "relative" }}>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "#D69A2C", fontWeight: 700, marginBottom: 14 }}>
              11 Jun — 19 Jul · 104 partidos
            </div>
            <div style={{ fontFamily: "'Big Shoulders Display',sans-serif", fontWeight: 900, fontSize: 62, lineHeight: 0.82, letterSpacing: "0.01em", textTransform: "uppercase" }}>Mundial</div>
            <div style={{ fontFamily: "'Big Shoulders Display',sans-serif", fontWeight: 900, fontSize: 62, lineHeight: 0.82, letterSpacing: "0.04em", textTransform: "uppercase", color: "#D69A2C", WebkitTextStroke: "1.5px #1B1714" }}>2026</div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 14 }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>🇺🇸</span>
              <span style={{ fontSize: 20, lineHeight: 1 }}>🇲🇽</span>
              <span style={{ fontSize: 20, lineHeight: 1 }}>🇨🇦</span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9A8C76" }}>USA · México · Canadá</span>
            </div>
          </div>
        </div>

        {/* INTRO + CTA */}
        <div style={{ padding: "20px 18px 16px", display: "flex", flexDirection: "column", gap: 15 }}>
          <div style={{ fontFamily: "'Big Shoulders Display',sans-serif", fontWeight: 800, fontSize: 25, lineHeight: 0.98, textTransform: "uppercase" }}>
            Tu Mundial, en tu hora.<br />
            <span style={{ color: "#A8452C" }}>Con tu gente.</span>
          </div>
          <div style={{ fontFamily: "'Archivo',sans-serif", fontSize: 14, lineHeight: 1.5, color: "#6B6256" }}>
            Todos los partidos en tu zona horaria. Marca tus favoritos con{" "}
            <span style={{ color: "#D69A2C", fontWeight: 700 }}>★</span>{" "}
            y agrégalos a tu calendario con un toque.
          </div>

          <button
            onClick={signIn}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 11,
              width: "100%", border: "2.5px solid #1B1714", background: "#FCF8EE",
              borderRadius: 7, padding: 14, cursor: "pointer", boxShadow: "4px 4px 0 #1B1714",
              fontFamily: "inherit",
            }}
          >
            <span style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #1B1714", background: "#2B53C2", color: "#FBF6EA", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Big Shoulders Display',sans-serif", fontWeight: 900, fontSize: 15 }}>G</span>
            <span style={{ fontFamily: "'Big Shoulders Display',sans-serif", fontWeight: 800, fontSize: 19, letterSpacing: "0.02em", textTransform: "uppercase", color: "#1B1714" }}>Entrar con Google</span>
          </button>
          <div style={{ textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: "0.04em", color: "#9A8C76", marginTop: -4 }}>
            Guardar y sincronizar requiere entrar · Gratis
          </div>
        </div>

        {/* PREVIEW */}
        {(previewA || previewB) && (
          <div style={{ padding: "4px 18px 20px", display: "flex", flexDirection: "column", gap: 13 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ position: "relative", width: 9, height: 9, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <span className="animate-livering" style={{ position: "absolute", width: 9, height: 9, borderRadius: "50%", background: "#E04127" }} />
                <span className="animate-livedot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#E04127" }} />
              </span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 10, letterSpacing: "0.14em", color: "#A8452C", textTransform: "uppercase" }}>
                {liveMatch ? "En vivo · sin entrar" : "Hoy · sin entrar"}
              </span>
              <span style={{ flex: 1, height: 2, background: "#1B1714" }} />
            </div>

            {previewA && <PreviewCard match={previewA} forceState={liveMatch ? "live" : "upcoming"} />}
            {previewB && <PreviewCard match={previewB} forceState="upcoming" />}

            <button
              onClick={signIn}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", border: "2px dashed #B3A88E", background: "transparent", borderRadius: 7, padding: 12, cursor: "pointer", fontFamily: "inherit" }}
            >
              <span style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "#7A7060" }}>Ver los 104 partidos →</span>
            </button>
          </div>
        )}

        {/* FOOTER STATS */}
        <div style={{ display: "flex", borderTop: "2.5px solid #1B1714", background: "#1B1714" }}>
          {[
            { n: "104", label: "Partidos", color: "#FBF6EA" },
            { n: "16",  label: "Sedes",    color: "#D69A2C" },
            { n: "3",   label: "Países",   color: "#FBF6EA" },
          ].map(({ n, label, color }, i) => (
            <div key={i} style={{ flex: 1, padding: "14px 6px", textAlign: "center", borderRight: i < 2 ? "2px solid #2C261D" : undefined }}>
              <div style={{ fontFamily: "'Big Shoulders Display',sans-serif", fontWeight: 800, fontSize: 24, lineHeight: 0.9, color }}>{n}</div>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, letterSpacing: "0.08em", color: "#9A8C76", textTransform: "uppercase", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
