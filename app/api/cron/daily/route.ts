import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { MATCHES } from "@/lib/matches";
import { buildEmailHtml } from "@/lib/email";
import { dateKeyForTz, todayForTz } from "@/lib/timezone";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mundial2026.vercel.app";
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@mundial2026.app";

  const { data: profiles } = await service
    .from("profiles")
    .select("id, email, full_name, timezone");

  if (!profiles?.length) return Response.json({ sent: 0 });

  const { data: watchlist } = await service
    .from("watchlist")
    .select("user_id, match_id");

  const wlMap: Record<string, Set<number>> = {};
  for (const row of watchlist ?? []) {
    if (!wlMap[row.user_id]) wlMap[row.user_id] = new Set();
    wlMap[row.user_id].add(row.match_id);
  }

  let sent = 0;
  for (const profile of profiles) {
    if (!profile.email) continue;
    const tz = profile.timezone ?? "America/Lima";
    const today = todayForTz(tz);
    const todayMatches = MATCHES.filter(
      m => !m.done && dateKeyForTz(m.u, tz) === today
    );
    if (!todayMatches.length) continue;

    const starred = wlMap[profile.id] ?? new Set<number>();
    const html = buildEmailHtml(todayMatches, starred, profile.full_name, tz, appUrl);
    const count = todayMatches.length;

    await resend.emails.send({
      from: `Mundial 2026 <${fromEmail}>`,
      to: profile.email,
      subject: `⚽ ${count} partido${count !== 1 ? "s" : ""} hoy — Mundial 2026`,
      html,
    });
    sent++;
  }

  return Response.json({ sent });
}
