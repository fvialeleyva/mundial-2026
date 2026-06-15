import { createClient } from "@/lib/supabase/server";
import { getOverrides } from "@/lib/overrides";
import { MATCHES } from "@/lib/matches";
import { limaDateKey, todayKey } from "@/lib/timezone";
import Tracker from "@/components/Tracker";
import Landing from "@/components/Landing";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const today = todayKey();
    const todayMatches = MATCHES.filter(m => limaDateKey(m.u) === today && !m.done);
    return <Landing todayMatches={todayMatches} />;
  }

  const overrides = await getOverrides();
  return <Tracker overrides={overrides} />;
}
