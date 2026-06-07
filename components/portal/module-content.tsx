'use client'

import { useEffect, useRef } from 'react'

export function ModuleContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const blocks = ref.current.querySelectorAll('pre')
    blocks.forEach(pre => {
      if (pre.querySelector('.copy-btn')) return

      pre.style.position = 'relative'

      const btn = document.createElement('button')
      btn.className = 'copy-btn'
      btn.textContent = 'Copy'
      btn.setAttribute('aria-label', 'Copy to clipboard')

      btn.addEventListener('click', () => {
        const code = pre.querySelector('code')
        const text = code?.innerText ?? pre.innerText
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = 'Copied!'
          setTimeout(() => { btn.textContent = 'Copy' }, 2000)
        })
      })

      pre.appendChild(btn)
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
