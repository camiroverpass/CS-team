import { fetchUpsellTab } from "@/lib/sheets.js";
import UpsellView from "../../components/UpsellView.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Q42025Page() {
  const tab = await fetchUpsellTab("q4-2025");
  return <UpsellView tab={tab} />;
}
