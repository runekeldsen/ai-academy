'use client'

import { useRef } from 'react'
import { recordResourceView, markResourceCompleted } from '@/actions/resources'

export function PodcastPlayer({ resourceId, src }: { resourceId: string; src: string }) {
  const started = useRef(false)
  const completed = useRef(false)

  function handlePlay() {
    if (!started.current) {
      started.current = true
      recordResourceView(resourceId)
    }
  }

  function handleEnded() {
    if (!completed.current) {
      completed.current = true
      markResourceCompleted(resourceId)
    }
  }

  return (
    <audio
      controls
      src={src}
      onPlay={handlePlay}
      onEnded={handleEnded}
      className="w-full rounded-lg"
      style={{ accentColor: '#7c3aed' }}
    />
  )
}
