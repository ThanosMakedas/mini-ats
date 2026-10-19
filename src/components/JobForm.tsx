import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Job, JobStatus } from '../lib/types'
import { jobStatusLabel } from '../i18n/sv'
import { Modal } from './Modal'

type Props = {
  customerId: string
  job?: Job
  onClose: () => void
  onSaved: () => void
}

export function JobForm({ customerId, job, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(job?.title ?? '')
  const [location, setLocation] = useState(job?.location ?? '')
  const [description, setDescription] = useState(job?.description ?? '')
  const [status, setStatus] = useState<JobStatus>(job?.status ?? 'open')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const fields = { title: title.trim(), location: location.trim(), description: description.trim(), status }
    const { error } = job
      ? await supabase.from('jobs').update(fields).eq('id', job.id)
      : await supabase.from('jobs').insert({ ...fields, customer_id: customerId })
    setSaving(false)
    if (error) {
      setError('Kunde inte spara jobbet.')
      return
    }
    onSaved()
  }

  return (
    <Modal title={job ? 'Redigera jobb' : 'Nytt jobb'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium">Titel</span>
          <input
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="t.ex. Backendutvecklare"
            className="input mt-1"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Ort</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="t.ex. Stockholm / Distans"
            className="input mt-1"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Beskrivning</span>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Arbetsuppgifter, krav och meriter"
            className="input mt-1"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as JobStatus)} className="input mt-1">
            {(['open', 'closed'] as const).map((s) => (
              <option key={s} value={s}>
                {jobStatusLabel[s]}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Avbryt
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Sparar...' : 'Spara'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
