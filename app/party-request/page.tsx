import { getCatalog } from "@/lib/catalog";
import PartyRequestView from "./PartyRequestView";

// Refreshes when the owner saves in /admin (cache tag "catalog"), and at least every 5 minutes.
export const revalidate = 300;

export default async function PartyRequestPage() {
  const { party } = await getCatalog();
  return <PartyRequestView party={party} />;
}
