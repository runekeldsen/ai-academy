export function SectionProgress({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  const done = total > 0 && completed === total
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 sm:w-32 h-1.5 rounded-full bg-gray-100">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: done ? '#16a34a' : '#2563eb' }}
        />
      </div>
      <span className={`text-xs tabular-nums ${done ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
        {completed}/{total}
      </span>
    </div>
  )
}
