'use client'

import { useState } from 'react'
import Navbar from './Navbar'
import ChatPanel from './chat/ChatPanel'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <>
      <Navbar onOpenChat={() => setIsChatOpen(true)} />
      <main className="mx-auto max-w-7xl px-4 py-6">
        {children}
      </main>
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  )
}
