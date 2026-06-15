import { Match } from "@/types";
import { STAGE_NAMES } from "@/lib/matches";
import { localTimeForTz } from "@/lib/timezone";

// Design tokens (matches globals.css)
const INK     = "#1B1714";
const PAPER   = "#F2ECDF";
const CARD    = "#FCF8EE";
const MUTED   = "#7A7060";
const HAIRLINE= "#D8CDB7";
const COBALT  = "#2B53C2";
const VERMILION = "#E04127";

function matchRow(m: Match, tz: string, starred: boolean): string {
  return `
    <tr>
      <td style="padding:0 0 10px 0">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1.5px solid ${INK};border-radius:8px;overflow:hidden;box-shadow:3px 3px 0 ${INK}">
          <tr>
            <!-- Left time block -->
            <td width="64" style="background:${COBALT};padding:12px 8px;text-align:center;vertical-align:middle">
              <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">
                ${localTimeForTz(m.u, tz)}
              </div>
            </td>
            <!-- Match info -->
            <td style="background:${CARD};padding:10px 12px;vertical-align:middle">
              <div style="font-size:10px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:3px">
                ${STAGE_NAMES[m.s]}${m.g ? ` · Grupo ${m.g}` : ""}
                ${starred ? `&nbsp;<span style="color:${VERMILION}">★</span>` : ""}
              </div>
              <div style="font-size:16px;font-weight:800;color:${INK};line-height:1.2;font-family:Georgia,serif;text-transform:uppercase;letter-spacing:-0.3px">
                ${m.t1}
              </div>
              <div style="font-size:10px;color:${MUTED};font-weight:600;margin:1px 0">vs</div>
              <div style="font-size:16px;font-weight:800;color:${INK};line-height:1.2;font-family:Georgia,serif;text-transform:uppercase;letter-spacing:-0.3px">
                ${m.t2}
              </div>
              <div style="font-size:10px;color:${MUTED};margin-top:4px">${m.v}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export function buildEmailHtml(
  todayMatches: Match[],
  starredIds: Set<number>,
  name: string | null,
  tz: string,
  appUrl: string
): string {
  const starred = todayMatches.filter(m => starredIds.has(m.id));
  const others  = todayMatches.filter(m => !starredIds.has(m.id));
  const greeting = name ? `Hola ${name.split(" ")[0]},` : "Hola,";
  const count = todayMatches.length;

  const section = (title: string, matches: Match[], isStarred: boolean) =>
    matches.length === 0 ? "" : `
      <p style="font-size:10px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:2px;margin:20px 0 8px">${title}</p>
      <table width="100%" cellpadding="0" cellspacing="0">${matches.map(m => matchRow(m, tz, isStarred)).join("")}</table>`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#E9E3D6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:0 auto">

    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">
      <tr>
        <td style="background:${INK};padding:16px 20px;border-radius:8px 8px 0 0;border:1.5px solid ${INK}">
          <span style="font-size:22px;font-weight:900;color:${PAPER};text-transform:uppercase;letter-spacing:-0.5px;font-family:Georgia,serif">
            MUNDIAL '26
          </span>
          <span style="display:block;font-size:11px;color:${MUTED};margin-top:2px;letter-spacing:1px">
            USA · MÉXICO · CANADÁ
          </span>
        </td>
      </tr>
      <tr>
        <td style="background:${VERMILION};padding:6px 20px;border:1.5px solid ${INK};border-top:none">
          <span style="font-size:11px;font-weight:700;color:white;text-transform:uppercase;letter-spacing:1.5px">
            ${count === 1 ? "1 partido hoy" : `${count} partidos hoy`}
          </span>
        </td>
      </tr>
    </table>

    <!-- Body -->
    <div style="background:${PAPER};border:1.5px solid ${INK};border-radius:0 0 8px 8px;padding:20px">
      <p style="color:${INK};font-size:15px;margin:0 0 4px;font-weight:600">${greeting}</p>
      <p style="color:${MUTED};font-size:13px;margin:0 0 4px">
        ${starred.length > 0 ? `Tienes ${starred.length} partido${starred.length > 1 ? "s" : ""} marcado${starred.length > 1 ? "s" : ""} hoy.` : "Aquí van los partidos de hoy."}
      </p>

      ${section("⭐ Tus partidos", starred, true)}
      ${section("📅 Todos los de hoy", others, false)}

      <!-- CTA -->
      <div style="text-align:center;margin-top:24px">
        <a href="${appUrl}"
           style="display:inline-block;background:${COBALT};color:white;font-weight:700;font-size:13px;text-decoration:none;padding:10px 28px;border-radius:6px;border:1.5px solid ${INK};box-shadow:3px 3px 0 ${INK};text-transform:uppercase;letter-spacing:0.5px">
          Abrir app
        </a>
      </div>
    </div>

  </div>
</body>
</html>`;
}
