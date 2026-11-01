export default function InventoryDataScopeNotice({
  historical,
}: {
  historical: boolean;
}) {
  return (
    <div
      role="note"
      className="border-button-info/30 bg-button-info/10 text-primary-text mt-4 rounded-lg border px-4 py-3 text-sm"
    >
      <p className="font-semibold">
        {historical ? "Historical inventory items" : "Latest available data"}
      </p>
      <p className="mt-1">
        Inventory dates filter only items and their trade histories. Profile,
        stats, other tabs, market values and current owner lookups always use
        the latest available data.
      </p>
    </div>
  );
}
