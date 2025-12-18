import React from "react";

interface SecurityNoticeProps {
  className?: string;
}

export default function SecurityNotice({
  className = "",
}: SecurityNoticeProps) {
  return (
    <div
      className={`bg-button-info/10 border-border-primary mb-2 flex items-start gap-4 rounded-lg border p-4 shadow-sm ${className}`}
    >
      <div className="relative z-10">
        <span className="text-primary-text text-base font-bold">
          Security Notice
        </span>
        <div className="text-secondary-text mt-1">
          If someone claims to be scanning inventories for JBCL but isn&apos;t
          one of these official bots, they are impersonating us. Please report
          such users to prevent scams.
        </div>
      </div>
    </div>
  );
}
