import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MATCHES } from "@/lib/matches";
import { getOverrides } from "@/lib/overrides";
import AdminPanel from "@/components/AdminPanel";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/");
  }

  const overrides = await getOverrides();
  const knockoutMatches = MATCHES.filter(m => m.s >= 1);

  return (
    <div className="min-h-screen bg-espresso px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <a href="/" className="text-xs text-muted hover:text-crema mb-4 inline-block">← Volver al app</a>
          <div className="text-2xl font-extrabold text-crema tracking-tight">⚙️ Admin — Equipos knockout</div>
          <div className="text-sm text-muted mt-1">
            Actualiza los nombres cuando se confirmen los enfrentamientos. Los cambios se reflejan de inmediato.
          </div>
        </div>
        <AdminPanel matches={knockoutMatches} overrides={overrides} />
      </div>
    </div>
  );
}
