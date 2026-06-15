import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { MATCHES } from "@/lib/matches";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { match_id, t1, f1, t2, f2 } = body as {
    match_id: number;
    t1: string; f1: string;
    t2: string; f2: string;
  };

  const match = MATCHES.find(m => m.id === match_id);
  if (!match || match.s < 1) {
    return Response.json({ error: "Solo se pueden editar partidos de eliminación" }, { status: 400 });
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await service.from("match_overrides").upsert({
    match_id,
    t1: t1.trim() || null,
    f1: f1.trim() || null,
    t2: t2.trim() || null,
    f2: f2.trim() || null,
    updated_at: new Date().toISOString(),
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
