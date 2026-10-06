import NotFoundView from "@/components/Layout/NotFoundView";

export default function InventoryNotFound() {
  return (
    <NotFoundView
      title="Invalid inventory lookup"
      description="This inventory link has an invalid Roblox user ID. Search again using a valid Roblox ID or username."
      homeHref="/inventories"
      homeLabel="Search inventories"
    />
  );
}
