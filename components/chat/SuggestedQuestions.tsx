'use client'

const QUESTIONS = [
  '내가 제일 많이 쓴 달은 언제야?',
  '화산귀환 얼마나 샀어?',
  '5점 준 작품 알려줘',
  '내 취향에 맞는 작품 추천해줘',
]

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void
}

export default function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 py-4">
      <div className="text-center">
        <p className="text-4xl">📚</p>
        <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          웹소설 AI
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          내 결제·리뷰 데이터를 분석해드려요
        </p>
      </div>
      <div className="w-full space-y-2">
        {QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-sm text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
