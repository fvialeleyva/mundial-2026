const LIMA_OFFSET = -5 * 60; // UTC-5 en minutos

function limaDate(utc: string): Date {
  const ms = new Date(utc).getTime() + LIMA_OFFSET * 60_000;
  return new Date(ms);
}

export function limaTime(utc: string): string {
  const d = limaDate(utc);
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function limaDateKey(utc: string): string {
  const d = limaDate(utc);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

export function todayKey(): string {
  return limaDateKey(new Date().toISOString());
}

const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function dayLabel(utc: string, isToday: boolean): string {
  const d = limaDate(utc);
  const label = `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
  const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
  return isToday ? "🟢 HOY — " + capitalized : capitalized;
}

export function gcalDate(utc: string): string {
  return new Date(utc).toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
}

export function isPast(utc: string): boolean {
  const end = new Date(new Date(utc).getTime() + 110 * 60 * 1000);
  return end < new Date();
}

export function isLive(utc: string, done: boolean): boolean {
  if (done) return false;
  const start = new Date(utc);
  const end = new Date(start.getTime() + 110 * 60 * 1000);
  const now = new Date();
  return start <= now && now <= end;
}
