import { supabase } from './supabase'
import type { Candidate } from './types'

export const CV_MAX_BYTES = 5 * 1024 * 1024

// The storage path is derived from the candidate, matching the storage policy and the assess-cv function.
export function cvPath(candidate: Pick<Candidate, 'id' | 'customer_id'>) {
  return `${candidate.customer_id}/${candidate.id}.pdf`
}

export function validateCv(file: File) {
  if (file.type !== 'application/pdf') return 'CV:t måste vara en PDF-fil.'
  if (file.size > CV_MAX_BYTES) return 'CV:t får vara högst 5 MB.'
  return null
}

export async function openCv(candidate: Pick<Candidate, 'id' | 'customer_id'>) {
  const { data } = await supabase.storage.from('cvs').createSignedUrl(cvPath(candidate), 60)
  if (data) window.open(data.signedUrl, '_blank', 'noopener')
}
