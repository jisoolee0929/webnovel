export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs dark:bg-blue-900/40">
        📚
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3 dark:bg-gray-700">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-400"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
