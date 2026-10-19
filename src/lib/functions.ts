import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'

// Calls an edge function and turns its { error } response body into a readable message.
export async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body })
  if (!error) return { data, error: null }
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = await error.context.json()
      if (typeof payload?.error === 'string') return { data: null, error: payload.error }
    } catch {
      // Fall through to the generic message.
    }
  }
  return { data: null, error: 'Något gick fel. Försök igen.' }
}

export function generatePassword(length = 12) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const values = crypto.getRandomValues(new Uint32Array(length))
  return Array.from(values, (v) => chars[v % chars.length]).join('')
}
