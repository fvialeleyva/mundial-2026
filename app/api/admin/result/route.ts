import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { match_id, r } = body as { match_id: number; r: string };

  if (typeof match_id !== "number") {
    return Response.json({ error: "match_id requerido" }, { status: 400 });
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const trimmed = r?.trim() ?? "";
  const { error } = await service.from("match_overrides").upsert({
    match_id,
    r: trimmed || null,
    done: trimmed.length > 0,
    updated_at: new Date().toISOString(),
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
