interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant'
    content: string
  }
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs dark:bg-blue-900/40">
          📚
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-sm bg-blue-500 text-white'
            : 'rounded-bl-sm bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  )
}
