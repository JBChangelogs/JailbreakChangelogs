import type { CatalogValues } from "@/hooks/usePartialItems";
import { getDemandColor, getTrendColor } from "@/utils/items/badgeColors";
import { hasItemValue } from "@/utils/items/itemValue";
import { formatFullValue } from "@/utils/trading/values";

export default function InventoryMarketSummary({
  data,
}: {
  data?: CatalogValues;
}) {
  return (
    <dl className="border-border-card bg-secondary-bg mb-3 grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg border p-2.5">
      <div>
        <dt className="text-secondary-text mb-1 text-xs">Clean value</dt>
        <dd className="bg-button-info text-form-button-text inline-flex rounded-md px-2 py-1 text-xs font-bold">
          <span className="sm:hidden">
            {hasItemValue(data?.cash_value) ? data.cash_value : "N/A"}
          </span>
          <span className="hidden sm:inline">
            {formatFullValue(data?.cash_value)}
          </span>
        </dd>
      </div>
      <div>
        <dt className="text-secondary-text mb-1 text-xs">Duped value</dt>
        <dd className="bg-button-info text-form-button-text inline-flex rounded-md px-2 py-1 text-xs font-bold">
          <span className="sm:hidden">
            {hasItemValue(data?.duped_value) ? data.duped_value : "N/A"}
          </span>
          <span className="hidden sm:inline">
            {formatFullValue(data?.duped_value)}
          </span>
        </dd>
      </div>
      <div>
        <dt className="text-secondary-text mb-1 text-xs">Demand</dt>
        <dd
          className={`${getDemandColor(data?.demand)} inline-flex rounded-md px-2 py-1 text-xs font-bold`}
        >
          {hasItemValue(data?.demand) ? data.demand : "Unknown"}
        </dd>
      </div>
      <div>
        <dt className="text-secondary-text mb-1 text-xs">Trend</dt>
        <dd
          className={`${getTrendColor(data?.trend)} inline-flex rounded-md px-2 py-1 text-xs font-bold`}
        >
          {hasItemValue(data?.trend) ? data.trend : "Unknown"}
        </dd>
      </div>
    </dl>
  );
}
