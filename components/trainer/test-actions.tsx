'use client'

import { deleteTest } from '@/actions/tests'

export function TestActions({ testId }: { testId: string }) {
  async function handleDelete() {
    if (!confirm('Delete this test and all its questions?')) return
    await deleteTest(testId)
  }

  return (
    <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 shrink-0">
      Delete
    </button>
  )
}
