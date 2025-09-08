export default function Loading() {
  return (
    <div className="min-h-screen bg-[#2E3944]">
      <div className="container mx-auto px-4 py-8">
        <div className="h-6 w-40 bg-gray-700/50 rounded mb-6" />
        <div className="h-10 w-72 bg-gray-700/50 rounded mb-2" />
        <div className="h-5 w-96 bg-gray-700/50 rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-5 w-20 bg-gray-700/50 rounded" />
                <div className="h-4 w-16 bg-gray-700/50 rounded" />
              </div>
              <div className="h-5 w-3/4 bg-gray-700/50 rounded mb-2" />
              <div className="h-4 w-1/3 bg-gray-700/50 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


