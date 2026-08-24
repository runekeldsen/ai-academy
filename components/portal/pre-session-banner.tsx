import Link from 'next/link'

export function PreSessionBanner({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl shrink-0">🚀</span>
        <div className="min-w-0">
          <p className="font-heading font-semibold text-gray-900">Get Ready for the Live AI Session</p>
          <p className="text-sm text-gray-500">Continue your pre-session prep</p>
        </div>
      </div>
      <span className="text-sm font-medium flex items-center gap-1 shrink-0" style={{ color: '#2563eb' }}>
        Continue <span className="group-hover:translate-x-0.5 transition-transform">→</span>
      </span>
    </Link>
  )
}
