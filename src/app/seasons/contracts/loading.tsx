export default function Loading() {
  return (
    <div className="min-h-screen bg-[#2E3944]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 h-6 w-40 rounded bg-gray-700/50" />
        <div className="mb-2 h-10 w-72 rounded bg-gray-700/50" />
        <div className="mb-8 h-5 w-96 rounded bg-gray-700/50" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="h-5 w-20 rounded bg-gray-700/50" />
                <div className="h-4 w-16 rounded bg-gray-700/50" />
              </div>
              <div className="mb-2 h-5 w-3/4 rounded bg-gray-700/50" />
              <div className="h-4 w-1/3 rounded bg-gray-700/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
