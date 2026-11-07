export default function SupportersSectionLoading() {
  return (
    <div className="pt-4 pb-8">
      <div className="mb-8 flex justify-center">
        <div className="bg-quaternary-bg/70 h-9 w-80 max-w-full animate-pulse rounded lg:h-10 lg:w-md"></div>
      </div>

      <div className="container mx-auto px-4">
        {[1, 2, 3].map((tier) => (
          <div key={tier} className="mb-12">
            <div className="mb-12 flex justify-center">
              <div className="bg-quaternary-bg/70 h-14 w-48 animate-pulse rounded-lg"></div>
            </div>
            <div className="flex gap-4 overflow-hidden pb-4 lg:gap-6 lg:pb-0">
              {[1, 2, 3, 4, 5].map((card) => (
                <div
                  key={card}
                  className="border-border-card bg-secondary-bg shrink-0 rounded-xl border p-4 shadow-md"
                  style={{ width: "280px" }}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-quaternary-bg/70 h-16 w-16 animate-pulse rounded-full"></div>
                    <div className="flex w-full flex-col items-center">
                      <div className="flex h-6 items-center">
                        <div className="bg-quaternary-bg/70 h-4 w-32 animate-pulse rounded"></div>
                      </div>
                      <div className="flex h-5 items-center">
                        <div className="bg-quaternary-bg/70 h-3.5 w-24 animate-pulse rounded"></div>
                      </div>
                      <div className="bg-quaternary-bg/70 mt-3 h-8 w-8 animate-pulse rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
