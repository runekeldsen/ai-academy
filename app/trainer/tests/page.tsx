import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TestActions } from '@/components/trainer/test-actions'

type Test = {
  id: string
  title: string
  description: string | null
  published: boolean
  academy_test_questions: { id: string }[]
  academy_modules: { title: string } | null
}

export default async function TrainerTestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tests } = await supabase
    .from('academy_skill_tests')
    .select('id, title, description, published, academy_test_questions(id), academy_modules(title)')
    .eq('trainer_id', user!.id)
    .order('sort_order', { ascending: true })

  const testList = (tests as unknown as Test[]) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Skill tests</h1>
          <p className="mt-1 text-sm text-gray-500">Create interactive tests to check learner understanding.</p>
        </div>
        <Link
          href="/trainer/tests/new"
          className="px-4 py-2 text-sm font-medium rounded-lg text-white"
          style={{ backgroundColor: '#2563eb' }}
        >
          + New test
        </Link>
      </div>

      {testList.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center space-y-3">
          <p className="text-sm text-gray-500">No tests yet. Create your first test to start checking learner skills.</p>
          <Link href="/trainer/tests/new" className="text-sm font-medium" style={{ color: '#2563eb' }}>
            Create a test →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {testList.map(test => (
            <div key={test.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{test.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-400">{test.academy_test_questions?.length ?? 0} questions</span>
                  {test.academy_modules && <span className="text-xs text-gray-400">· {test.academy_modules.title}</span>}
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                test.published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {test.published ? 'Published' : 'Draft'}
              </span>
              <Link
                href={`/trainer/tests/${test.id}/edit`}
                className="text-xs text-gray-400 hover:text-gray-700"
              >
                Edit
              </Link>
              <TestActions testId={test.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
