'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

export async function addYouTubeVideo(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const url = (formData.get('url') as string)?.trim()

  if (!title) return { error: 'Title is required' }
  if (!url || !extractYouTubeId(url)) return { error: 'Please enter a valid YouTube URL' }

  const { error } = await supabase
    .from('academy_resources')
    .insert({ trainer_id: user.id, title, description, type: 'youtube', url })
  if (error) return { error: error.message }

  revalidatePath('/trainer/resources')
  revalidatePath('/portal/resources')
  return {}
}

export async function uploadPodcast(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const file = formData.get('file') as File

  if (!title) return { error: 'Title is required' }
  if (!file || file.size === 0) return { error: 'Please select a file' }
  if (!file.name.toLowerCase().endsWith('.mp3')) return { error: 'Only MP3 files are supported' }

  const admin = getAdmin()

  // Ensure bucket exists
  const { data: buckets } = await admin.storage.listBuckets()
  if (!buckets?.find(b => b.name === 'academy-podcasts')) {
    await admin.storage.createBucket('academy-podcasts', { public: true })
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${user.id}/${Date.now()}-${safeName}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await admin.storage
    .from('academy-podcasts')
    .upload(path, bytes, { contentType: 'audio/mpeg', upsert: false })
  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = admin.storage.from('academy-podcasts').getPublicUrl(path)

  const { error: dbError } = await admin
    .from('academy_resources')
    .insert({ trainer_id: user.id, title, description, type: 'podcast', url: publicUrl })
  if (dbError) return { error: dbError.message }

  revalidatePath('/trainer/resources')
  revalidatePath('/portal/resources')
  return {}
}

export async function updateResourceOrder(updates: { id: string; sort_order: number }[]): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  for (const { id, sort_order } of updates) {
    await supabase
      .from('academy_resources')
      .update({ sort_order })
      .eq('id', id)
      .eq('trainer_id', user.id)
  }
  return {}
}

export async function recordResourceView(resourceId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('academy_resource_views')
    .upsert({ resource_id: resourceId, learner_id: user.id }, { onConflict: 'resource_id,learner_id', ignoreDuplicates: true })
}

export async function markResourceCompleted(resourceId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('academy_resource_views')
    .update({ completed_at: new Date().toISOString() })
    .eq('resource_id', resourceId)
    .eq('learner_id', user.id)
    .is('completed_at', null)
}

export async function deleteResource(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Fetch resource to get URL (for storage cleanup on podcasts)
  const { data: resource } = await supabase
    .from('academy_resources')
    .select('type, url')
    .eq('id', id)
    .eq('trainer_id', user.id)
    .single()
  if (!resource) return { error: 'Not found' }

  const admin = getAdmin()

  if (resource.type === 'podcast') {
    // Extract storage path from public URL and delete the file
    const url = new URL(resource.url)
    const pathParts = url.pathname.split('/academy-podcasts/')
    if (pathParts[1]) {
      await admin.storage.from('academy-podcasts').remove([pathParts[1]])
    }
  }

  const { error } = await admin
    .from('academy_resources')
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/trainer/resources')
  revalidatePath('/portal/resources')
  return {}
}
