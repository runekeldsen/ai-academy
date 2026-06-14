'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Polls the server component so new messages appear without a manual refresh.
// Only refreshes while the tab is visible, and immediately when it regains focus.
export function ThreadAutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    const id = setInterval(refreshIfVisible, intervalMs)
    document.addEventListener('visibilitychange', refreshIfVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [router, intervalMs])

  return null
}
