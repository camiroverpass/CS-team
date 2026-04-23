import { fetchUpsellTab } from "@/lib/sheets.js";
import UpsellView from "../../components/UpsellView.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Q12026Page() {
  const tab = await fetchUpsellTab("q1-2026");
  return <UpsellView tab={tab} />;
}
