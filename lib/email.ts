import { Match } from "@/types";
import { STAGE_NAMES } from "@/lib/matches";
import { localTimeForTz } from "@/lib/timezone";

function matchRow(m: Match, tz: string): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #3D2B18">
        <div style="font-size:12px;color:#9A8878;margin-bottom:3px">${localTimeForTz(m.u, tz)}</div>
        <div style="font-size:15px;font-weight:700;color:#F0E8D4">
          ${m.f1} ${m.t1} <span style="color:#9A8878;font-weight:400">vs</span> ${m.t2} ${m.f2}
        </div>
        <div style="font-size:11px;color:#9A8878;margin-top:2px">
          ${STAGE_NAMES[m.s]}${m.g ? ` · Grupo ${m.g}` : ""} &nbsp;·&nbsp; ${m.v}
        </div>
      </td>
    </tr>`;
}

function section(title: string, matches: Match[], tz: string): string {
  if (!matches.length) return "";
  return `
    <h3 style="color:#9A8878;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:20px 0 8px 0">
      ${title}
    </h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      ${matches.map(m => matchRow(m, tz)).join("")}
    </table>`;
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

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#1A1208;margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#251910;border-radius:16px;border:1px solid #3D2B18;overflow:hidden">

    <div style="background:linear-gradient(135deg,#110D06,#1D1409);padding:24px 24px 20px;border-bottom:1px solid #3D2B18">
      <div style="font-size:30px">⚽</div>
      <div style="font-size:20px;font-weight:800;color:#F0E8D4;margin-top:6px;letter-spacing:-0.5px">Mundial 2026</div>
      <div style="font-size:11px;color:#9A8878;margin-top:2px">USA · México · Canadá</div>
    </div>

    <div style="padding:20px 24px 8px">
      <p style="color:#F0E8D4;font-size:15px;margin:0 0 4px;font-weight:600">${greeting}</p>
      <p style="color:#9A8878;font-size:13px;margin:0 0 4px">
        ${count === 1 ? "Hay 1 partido hoy." : `Hay ${count} partidos hoy.`}
      </p>
      ${section("⭐ Tus partidos", starred, tz)}
      ${section("📅 Todos los de hoy", others, tz)}
    </div>

    <div style="padding:20px 24px;border-top:1px solid #3D2B18;text-align:center;margin-top:12px">
      <a href="${appUrl}"
         style="display:inline-block;background:#3EBD7A;color:#1A1208;font-weight:700;font-size:14px;text-decoration:none;padding:10px 28px;border-radius:8px">
        Ver en la app
      </a>
    </div>

  </div>
</body>
</html>`;
}
