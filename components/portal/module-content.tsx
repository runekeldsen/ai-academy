'use client'

import { useEffect, useRef, useState } from 'react'
import { setStepChecked } from '@/actions/progress'

export function ModuleContent({
  html,
  moduleId,
  stepCount = 0,
  initialCompletedSteps = [],
}: {
  html: string
  moduleId: string
  stepCount?: number
  initialCompletedSteps?: number[]
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [checkedCount, setCheckedCount] = useState(initialCompletedSteps.length)

  useEffect(() => {
    if (!ref.current) return

    // Auto-size each textarea to fit its content
    ref.current.querySelectorAll<HTMLTextAreaElement>('.prompt-textarea').forEach(textarea => {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    })

    // Wire up copy buttons
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

    // Wire up step check buttons
    const checked = new Set(initialCompletedSteps)
    ref.current.querySelectorAll<HTMLButtonElement>('.step-check').forEach(btn => {
      const idx = Number(btn.dataset.stepIndex)
      if (checked.has(idx)) btn.classList.add('checked')
      btn.addEventListener('click', () => {
        const nowChecked = !btn.classList.contains('checked')
        btn.classList.toggle('checked', nowChecked)
        setCheckedCount(c => c + (nowChecked ? 1 : -1))
        setStepChecked(moduleId, idx, nowChecked)
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html])

  return (
    <div>
      {stepCount > 0 && (
        <div className="sticky top-2 z-10 mb-4 flex justify-end pointer-events-none">
          <span
            className={`pointer-events-auto text-xs font-medium px-3 py-1.5 rounded-full border shadow-sm transition-colors ${
              checkedCount === stepCount
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {checkedCount === stepCount ? 'All steps done' : `Steps: ${checkedCount}/${stepCount}`}
          </span>
        </div>
      )}
      <div
        ref={ref}
        className="module-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
