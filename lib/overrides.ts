import { createClient } from "@/lib/supabase/server";
import { Match } from "@/types";

export async function getOverrides(): Promise<Record<number, Partial<Match>>> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("match_overrides")
      .select("match_id, t1, f1, t2, f2");
    if (!data) return {};
    const result: Record<number, Partial<Match>> = {};
    for (const row of data) {
      const override: Partial<Match> = {};
      if (row.t1 !== null) override.t1 = row.t1;
      if (row.f1 !== null) override.f1 = row.f1;
      if (row.t2 !== null) override.t2 = row.t2;
      if (row.f2 !== null) override.f2 = row.f2;
      result[row.match_id] = override;
    }
    return result;
  } catch {
    return {};
  }
}
