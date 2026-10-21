import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Modal } from './Modal'

// Lets the logged in user replace the password the admin gave them.
export function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const { session } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (next.length < 8) return setError('Det nya lösenordet måste vara minst 8 tecken.')
    if (next !== repeat) return setError('De nya lösenorden är inte lika.')
    if (next === current) return setError('Det nya lösenordet måste skilja sig från det nuvarande.')

    const email = session?.user.email
    if (!email) return setError('Du är inte inloggad.')

    setSaving(true)
    // Check the current password first, so someone at an unlocked computer cannot change it.
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: current })
    if (signInError) {
      setSaving(false)
      return setError('Det nuvarande lösenordet stämmer inte.')
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: next })
    if (updateError) {
      setSaving(false)
      return setError('Kunde inte byta lösenord. Försök igen.')
    }
    // Log out every other device that used the old password.
    await supabase.auth.signOut({ scope: 'others' })
    setSaving(false)
    setDone(true)
  }

  return (
    <Modal title="Byt lösenord" onClose={onClose}>
      {done ? (
        <div className="space-y-4">
          <p className="text-sm text-emerald-700">Lösenordet är bytt. Andra enheter har loggats ut.</p>
          <div className="flex justify-end">
            <button onClick={onClose} className="btn-primary">
              Stäng
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Nuvarande lösenord</span>
            <input
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="input mt-1"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Nytt lösenord (minst 8 tecken)</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="input mt-1"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Upprepa nytt lösenord</span>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              className="input mt-1"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Avbryt
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Sparar...' : 'Byt lösenord'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
