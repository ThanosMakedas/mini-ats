import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Candidate, CandidateStage, Job } from '../lib/types'
import { STAGES, stageLabel } from '../i18n/sv'
import { Modal } from './Modal'

type Props = {
  customerId: string
  jobs: Job[]
  candidate?: Candidate
  defaultJobId?: string
  onClose: () => void
  onSaved: () => void
}

// Accepts "linkedin.com/in/x" as well as full URLs.
function normalizeUrl(value: string) {
  const v = value.trim()
  if (!v) return ''
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}

export function CandidateForm({ customerId, jobs, candidate, defaultJobId, onClose, onSaved }: Props) {
  const firstOpenJob = jobs.find((j) => j.status === 'open') ?? jobs[0]
  const [jobId, setJobId] = useState(candidate?.job_id ?? defaultJobId ?? firstOpenJob?.id ?? '')
  const [fullName, setFullName] = useState(candidate?.full_name ?? '')
  const [email, setEmail] = useState(candidate?.email ?? '')
  const [phone, setPhone] = useState(candidate?.phone ?? '')
  const [linkedinUrl, setLinkedinUrl] = useState(candidate?.linkedin_url ?? '')
  const [stage, setStage] = useState<CandidateStage>(candidate?.stage ?? 'new')
  const [notes, setNotes] = useState(candidate?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const fields = {
      job_id: jobId,
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      linkedin_url: normalizeUrl(linkedinUrl),
      stage,
      notes: notes.trim(),
    }
    const { error } = candidate
      ? await supabase.from('candidates').update(fields).eq('id', candidate.id)
      : await supabase.from('candidates').insert({ ...fields, customer_id: customerId })
    setSaving(false)
    if (error) {
      setError('Kunde inte spara kandidaten.')
      return
    }
    onSaved()
  }

  async function handleDelete() {
    if (!candidate || !window.confirm(`Ta bort ${candidate.full_name}?`)) return
    const { error } = await supabase.from('candidates').delete().eq('id', candidate.id)
    if (error) {
      setError('Kunde inte ta bort kandidaten.')
      return
    }
    onSaved()
  }

  if (jobs.length === 0) {
    return (
      <Modal title="Ny kandidat" onClose={onClose}>
        <p className="text-sm text-slate-600">Lägg upp ett jobb först, sedan kan du lägga till kandidater till det.</p>
      </Modal>
    )
  }

  return (
    <Modal title={candidate ? 'Redigera kandidat' : 'Ny kandidat'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium">Namn</span>
          <input required autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} className="input mt-1" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Jobb</span>
            <select required value={jobId} onChange={(e) => setJobId(e.target.value)} className="input mt-1">
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                  {j.status === 'closed' ? ' (stängd)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Steg</span>
            <select value={stage} onChange={(e) => setStage(e.target.value as CandidateStage)} className="input mt-1">
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {stageLabel[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium">LinkedIn</span>
          <input
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://www.linkedin.com/in/..."
            className="input mt-1"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">E-post</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input mt-1" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Telefon</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input mt-1" />
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium">Anteckningar</span>
          <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="input mt-1" />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-2">
          {candidate && (
            <button type="button" onClick={handleDelete} className="btn-danger">
              Ta bort
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-secondary ml-auto">
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
