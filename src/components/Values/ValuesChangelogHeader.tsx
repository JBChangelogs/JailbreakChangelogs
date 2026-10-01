import React from "react";
import RelatedValuePages from "./RelatedValuePages";

const ValuesChangelogHeader: React.FC = () => {
  return (
    <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6">
      <div className="mb-2">
        <h2 className="page-heading">Item Changelogs & History</h2>
      </div>
      <p className="text-secondary-text mb-4">
        Track every value change, price adjustment, and item modification we
        make to keep the value list accurate.
      </p>
      <RelatedValuePages current="changelogs" />
    </div>
  );
};

export default ValuesChangelogHeader;
