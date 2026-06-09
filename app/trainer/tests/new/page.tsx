import { createClient } from '@/lib/supabase/server'
import { TestForm } from '@/components/trainer/test-form'

export default async function NewTestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: modules } = await supabase
    .from('academy_modules')
    .select('id, title')
    .eq('trainer_id', user!.id)
    .order('title', { ascending: true })

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">New test</h1>
        <p className="mt-1 text-sm text-gray-500">Set the title and link it to a module. You'll add questions next.</p>
      </div>
      <TestForm modules={modules ?? []} />
    </div>
  )
}
