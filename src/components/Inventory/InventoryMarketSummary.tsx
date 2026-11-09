import type { CatalogValues } from "@/hooks/usePartialItems";
import { getDemandColor } from "@/utils/items/badgeColors";
import { TrendChips } from "@/components/Items/TrendChips";
import { hasItemValue } from "@/utils/items/itemValue";
import { formatFullValue } from "@/utils/trading/values";
import { getTradeItemMarketDetails } from "@/utils/trading/marketDetails";

export default function InventoryMarketSummary({
  data,
  isDuped = false,
}: {
  data?: CatalogValues;
  isDuped?: boolean;
}) {
  const { demand, trends } = getTradeItemMarketDetails(data ?? {}, isDuped);

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
        <dt className="text-secondary-text mb-1 text-xs">
          {isDuped ? "Duped demand" : "Demand"}
        </dt>
        <dd
          className={`${getDemandColor(demand)} inline-flex rounded-md px-2 py-1 text-xs font-bold`}
        >
          {demand ?? (isDuped ? "N/A" : "Unknown")}
        </dd>
      </div>
      <div>
        <dt className="text-secondary-text mb-1 text-xs">Trend</dt>
        <dd>
          <TrendChips
            trends={trends}
            chipClassName="inline-flex rounded-md px-2 py-1 text-xs font-bold"
          />
        </dd>
      </div>
    </dl>
  );
}
