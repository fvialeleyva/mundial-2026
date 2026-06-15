import { getOverrides } from "@/lib/overrides";
import Tracker from "@/components/Tracker";

export default async function Home() {
  const overrides = await getOverrides();
  return <Tracker overrides={overrides} />;
}
