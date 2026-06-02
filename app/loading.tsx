export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
        <div className="h-72 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
      <div className="h-64 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
    </div>
  )
}
