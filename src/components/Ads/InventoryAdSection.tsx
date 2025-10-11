"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import DisplayAd from "./DisplayAd";
import AdRemovalNotice from "./AdRemovalNotice";

interface InventoryAdSectionProps {
  className?: string;
}

export default function InventoryAdSection({
  className = "",
}: InventoryAdSectionProps) {
  const { user } = useAuthContext();
  const currentUserPremiumType = user?.premiumtype || 0;

  // Only show ad for non-premium users
  if (currentUserPremiumType !== 0) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        .responsive-ad-container-inventory {
          width: 100%;
          max-width: 320px;
          height: 100px;
          min-width: 250px;
          border-radius: 8px;
          overflow: hidden;
          display: block;
        }

        @media (min-width: 500px) {
          .responsive-ad-container-inventory {
            width: 100%;
            max-width: 336px;
            height: 280px;
            min-width: 250px;
            display: block;
          }
        }

        @media (min-width: 700px) {
          .responsive-ad-container-inventory {
            width: 100%;
            max-width: 300px;
            height: 250px;
            min-width: 250px;
            display: block;
          }
        }

        @media (min-width: 800px) {
          .responsive-ad-container-inventory {
            width: 100%;
            max-width: 728px;
            height: 90px;
            min-width: 250px;
            display: block;
          }
        }
      `}</style>
      <div className={className}>
        <div className="flex flex-col items-center">
          <span className="text-secondary-text mb-2 block text-center text-xs">
            ADVERTISEMENT
          </span>
          <div className="responsive-ad-container-inventory">
            <DisplayAd
              adSlot="3210934616"
              adFormat="fluid"
              style={{ display: "block", width: "100%", height: "100%" }}
            />
          </div>
          <AdRemovalNotice className="mt-2" />
        </div>
      </div>
    </>
  );
}
