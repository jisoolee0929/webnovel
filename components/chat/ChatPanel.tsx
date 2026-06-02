'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Trash2, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ChatMessage from './ChatMessage'
import TypingIndicator from './TypingIndicator'
import SuggestedQuestions from './SuggestedQuestions'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() =>
    typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  )
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 새 메시지가 오면 스크롤 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // textarea 자동 높이 조절
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }, [input])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMsg: Message = { role: 'user', content: content.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          session_id: sessionId,
          history: messages.slice(-10),
        }),
      })

      const data = await res.json() as { response?: string; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? '응답 오류')

      setMessages((prev) => [...prev, { role: 'assistant', content: data.response! }])
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '오류가 발생했어요'
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `죄송해요, 오류가 발생했어요 🙏\n${errMsg}`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleClear = async () => {
    setMessages([])
    try {
      await supabase.from('chat_messages').delete().eq('session_id', sessionId)
    } catch {
      // silently ignore
    }
  }

  return (
    <>
      {/* 오버레이 */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />}

      {/* 사이드패널 */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-gray-900 sm:w-[380px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 헤더 */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
          <span className="font-semibold text-gray-900 dark:text-white">📚 웹소설 AI</span>
          <div className="flex items-center gap-0.5">
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                title="대화 초기화"
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && !isLoading ? (
            <SuggestedQuestions onSelect={sendMessage} />
          ) : (
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 입력창 */}
        <div className="shrink-0 border-t border-gray-100 p-3 dark:border-gray-700">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-900"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white transition hover:bg-blue-600 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-xs text-gray-400 dark:text-gray-600">
            Enter 전송 · Shift+Enter 줄바꿈
          </p>
        </div>
      </aside>
    </>
  )
}
