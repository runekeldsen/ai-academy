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
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(() => new Set(initialCompletedSteps))

  // Server actions make Next.js re-apply the page payload, which re-sets this
  // component's innerHTML and wipes any classes or listeners added to it.
  // So: clicks are delegated to the persistent wrapper div (below), and the
  // checked state lives in React state and is re-stamped after every render.
  useEffect(() => {
    const root = ref.current
    if (!root) return

    root.querySelectorAll<HTMLButtonElement>('.step-check').forEach(btn => {
      btn.classList.toggle('checked', checkedSteps.has(Number(btn.dataset.stepIndex)))
    })

    root.querySelectorAll<HTMLTextAreaElement>('.prompt-textarea').forEach(textarea => {
      if (textarea.dataset.sized) return
      textarea.dataset.sized = '1'
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    })
  })

  function handleClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement

    const copyBtn = target.closest<HTMLButtonElement>('.copy-btn')
    if (copyBtn) {
      const textarea = copyBtn.previousElementSibling as HTMLTextAreaElement | null
      if (!textarea) return
      navigator.clipboard.writeText(textarea.value).then(() => {
        copyBtn.textContent = 'Copied!'
        setTimeout(() => { copyBtn.textContent = 'Copy prompt' }, 2000)
      })
      return
    }

    const stepBtn = target.closest<HTMLButtonElement>('.step-check')
    if (stepBtn) {
      const idx = Number(stepBtn.dataset.stepIndex)
      const nowChecked = !checkedSteps.has(idx)
      const next = new Set(checkedSteps)
      if (nowChecked) next.add(idx)
      else next.delete(idx)
      setCheckedSteps(next)
      setStepChecked(moduleId, idx, nowChecked)
    }
  }

  const checkedCount = checkedSteps.size

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
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
