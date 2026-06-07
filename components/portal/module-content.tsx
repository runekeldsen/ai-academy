'use client'

import { useEffect, useRef } from 'react'

export function ModuleContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.querySelectorAll<HTMLButtonElement>('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const textarea = btn.previousElementSibling as HTMLTextAreaElement | null
        if (!textarea) return
        navigator.clipboard.writeText(textarea.value).then(() => {
          btn.textContent = 'Copied!'
          setTimeout(() => { btn.textContent = 'Copy prompt' }, 2000)
        })
      })
    })
  }, [html])

  return (
    <div
      ref={ref}
      className="module-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
