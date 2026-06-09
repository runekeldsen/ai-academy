'use client'

import { useEffect } from 'react'
import { markRead } from '@/actions/notifications'

export function MarkRead({ section }: { section: 'projects' | 'support' | 'portal' }) {
  useEffect(() => { markRead(section) }, [section])
  return null
}
