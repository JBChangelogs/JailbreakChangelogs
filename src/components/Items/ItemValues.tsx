import { Icon } from "@/components/ui/IconWrapper";
import Image from "next/image";
import { formatFullValue, formatPrice, getValueChange } from "@/utils/values";
import { getDemandColor, getTrendColor } from "@/utils/badgeColors";
import { RecentChange } from "@/types";

interface ItemValuesProps {
  cashValue: string | null;
  dupedValue: string | null;
  demand: string;
  trend?: string | null;
  notes: string;
  price: string;
  health: number;
  type: string;
  recentChanges?: RecentChange[] | null;
}

export default function ItemValues({
  cashValue,
  dupedValue,
  demand,
  trend,
  notes,
  price,
  health,
  type,
  recentChanges,
}: ItemValuesProps) {
  const isRobuxPrice = price.toLowerCase().includes("robux");
  const isUSDPrice = price.includes("$");
  const hasNoPrice = price === "N/A";

  return (
    <div className="border-border-primary bg-secondary-bg hover:shadow-card-shadow mb-8 space-y-6 rounded-lg border p-6 shadow-lg transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="bg-button-info/20 flex h-10 w-10 items-center justify-center rounded-lg">
          <Icon
            icon="heroicons:banknotes"
            className="text-button-info h-6 w-6"
          />
        </div>
        <h3 className="text-primary-text text-2xl font-bold">Item Values</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Cash Value */}
        <div className="border-border-primary bg-primary-bg rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-tertiary-text text-sm font-semibold tracking-wide uppercase">
              Cash Value
            </h4>
            {(() => {
              const cashChange = getValueChange(recentChanges, "cash_value");
              if (cashChange && cashChange.difference !== 0) {
                const isPositive = cashChange.difference > 0;
                return (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                      isPositive
                        ? "bg-status-success text-white"
                        : "bg-status-error text-white"
                    }`}
                  >
                    {isPositive ? "+" : "-"}
                    {Math.abs(cashChange.difference).toLocaleString()}
                  </span>
                );
              }
              return null;
            })()}
          </div>
          <p className="text-primary-text text-3xl font-bold">
            {formatFullValue(cashValue)}
          </p>
        </div>

        {/* Duped Value */}
        <div className="border-border-primary bg-primary-bg rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-tertiary-text text-sm font-semibold tracking-wide uppercase">
              Duped Value
            </h4>
            {(() => {
              const dupedChange = getValueChange(recentChanges, "duped_value");
              if (dupedChange && dupedChange.difference !== 0) {
                const isPositive = dupedChange.difference > 0;
                return (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                      isPositive
                        ? "bg-status-success text-white"
                        : "bg-status-error text-white"
                    }`}
                  >
                    {isPositive ? "+" : "-"}
                    {Math.abs(dupedChange.difference).toLocaleString()}
                  </span>
                );
              }
              return null;
            })()}
          </div>
          <p className="text-primary-text text-3xl font-bold">
            {formatFullValue(dupedValue)}
          </p>
        </div>

        {/* Original Price */}
        <div className="border-border-primary bg-primary-bg rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-tertiary-text text-sm font-semibold tracking-wide uppercase">
              Original Price
            </h4>
          </div>
          <div className="flex items-center gap-2">
            {!hasNoPrice &&
              (isRobuxPrice ? (
                <Image
                  src="/assets/icons/Robux_Icon.webp"
                  alt="Robux"
                  width={20}
                  height={20}
                  className="h-6 w-6"
                />
              ) : (
                !isUSDPrice &&
                price.toLowerCase() !== "free" && (
                  <Icon
                    icon="heroicons:banknotes"
                    className="text-primary-text h-6 w-6"
                  />
                )
              ))}
            <p className="text-primary-text text-3xl font-bold">
              {formatPrice(price)}
            </p>
          </div>
        </div>

        {/* Vehicle Health - Only show for vehicles */}
        {type.toLowerCase() === "vehicle" && (
          <div className="border-border-primary bg-primary-bg rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2">
              <h4 className="text-tertiary-text text-sm font-semibold tracking-wide uppercase">
                Vehicle Health
              </h4>
            </div>
            <p className="text-primary-text text-3xl font-bold">
              {health || "???"}
            </p>
          </div>
        )}

        {/* Item Demand */}
        <div className="border-border-primary bg-primary-bg rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-tertiary-text text-sm font-semibold tracking-wide uppercase">
              Item Demand
            </h4>
          </div>
          <span
            className={`${getDemandColor(demand)} inline-block rounded-lg px-3 py-2 text-lg font-bold`}
          >
            {demand === "N/A" ? "Unknown" : demand}
          </span>
        </div>

        {/* Item Trend */}
        <div className="border-border-primary bg-primary-bg rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-tertiary-text text-sm font-semibold tracking-wide uppercase">
              Trend
            </h4>
          </div>
          <span
            className={`${getTrendColor(trend || "N/A")} inline-block rounded-lg px-3 py-2 text-lg font-bold`}
          >
            {!trend || trend === "Unknown" || trend === "N/A"
              ? "Unknown"
              : trend}
          </span>
        </div>
      </div>

      {/* Item Notes - Full width */}
      {notes && notes.trim() !== "" && (
        <div className="border-border-primary bg-primary-bg rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-tertiary-text text-sm font-semibold tracking-wide uppercase">
              Item Notes
            </h4>
          </div>
          <p className="text-primary-text text-3xl font-bold">{notes}</p>
        </div>
      )}
    </div>
  );
}
