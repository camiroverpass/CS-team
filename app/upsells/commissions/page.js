import { fetchUpsellTab } from "@/lib/sheets.js";
import UpsellView from "../../components/UpsellView.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CommissionsPage() {
  const tab = await fetchUpsellTab("commissions");
  return <UpsellView tab={tab} />;
}
