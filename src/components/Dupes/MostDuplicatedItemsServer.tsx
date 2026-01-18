import { fetchMostDuplicatedItems } from "@/utils/api";
import MostDuplicatedItems from "./MostDuplicatedItems";

export default async function MostDuplicatedItemsServer() {
  const items = await fetchMostDuplicatedItems();
  return <MostDuplicatedItems items={items} />;
}
