'use client'

import { useState, useRef } from 'react'
import { recordResourceView } from '@/actions/resources'

type Video = { id: string; title: string; description: string | null; youtubeId: string }

function VideoCard({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false)
  const tracked = useRef(false)

  function handlePlay() {
    setPlaying(true)
    if (!tracked.current) {
      tracked.current = true
      recordResourceView(video.id)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
      {playing ? (
        <div className="relative" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <button
          onClick={handlePlay}
          className="relative w-full focus:outline-none"
          style={{ paddingTop: '56.25%' }}
          aria-label={`Play ${video.title}`}
        >
          <img
            src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark overlay on hover */}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
              style={{ backgroundColor: 'rgba(220,38,38,0.92)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            </div>
          </div>
        </button>
      )}

      <div className="p-4">
        <h3 className="font-heading font-semibold text-gray-800 leading-snug">{video.title}</h3>
        {video.description && (
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{video.description}</p>
        )}
        {playing && (
          <button
            onClick={() => setPlaying(false)}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕ Close player
          </button>
        )}
      </div>
    </div>
  )
}

export function VideoGrid({ videos }: { videos: Video[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map(v => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  )
}
