import { ModuleForm } from '@/components/trainer/module-form'

export default async function NewModulePage({ searchParams }: { searchParams: Promise<{ sectionId?: string }> }) {
  const { sectionId } = await searchParams
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">New module</h1>
        <p className="mt-1 text-sm text-gray-500">Add a training module to this section.</p>
      </div>
      <ModuleForm sectionId={sectionId ?? ''} />
    </div>
  )
}
