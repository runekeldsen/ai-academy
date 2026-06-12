import Link from 'next/link'

type PagerModule = { id: string; title: string; sectionTitle: string }

export function ModulePager({ prev, next }: { prev: PagerModule | null; next: PagerModule | null }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {prev ? (
        <Link
          href={`/portal/modules/${prev.id}`}
          className="group card-lift bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all p-4 flex items-center gap-3"
        >
          <span className="text-gray-400 group-hover:-translate-x-0.5 transition-transform shrink-0" aria-hidden>←</span>
          <span className="min-w-0">
            <span className="block text-xs text-gray-400">Previous</span>
            <span className="block text-sm font-medium text-gray-700 truncate">{prev.title}</span>
          </span>
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
      {next ? (
        <Link
          href={`/portal/modules/${next.id}`}
          className="group rounded-xl p-4 flex items-center justify-end gap-3 text-white hover:opacity-95 transition-all text-right"
          style={{ backgroundColor: '#2563eb' }}
        >
          <span className="min-w-0">
            <span className="block text-xs text-blue-200">Up next · {next.sectionTitle}</span>
            <span className="block text-sm font-semibold truncate">{next.title}</span>
          </span>
          <span className="group-hover:translate-x-0.5 transition-transform shrink-0" aria-hidden>→</span>
        </Link>
      ) : (
        <Link
          href="/portal"
          className="group bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-end gap-3 text-right hover:bg-green-100 transition-colors"
        >
          <span className="min-w-0">
            <span className="block text-xs text-green-600">You&apos;ve reached the end of your path</span>
            <span className="block text-sm font-semibold text-green-700">Back to portal</span>
          </span>
          <span className="text-green-600 group-hover:translate-x-0.5 transition-transform shrink-0" aria-hidden>→</span>
        </Link>
      )}
    </div>
  )
}
