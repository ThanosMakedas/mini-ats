import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { cvPath, openCv, validateCv } from '../lib/cv'
import type { Candidate, CandidateStage, CvAssessment, Job } from '../lib/types'
import { STAGES, stageLabel } from '../i18n/sv'
import { CvAssessmentPanel } from './CvAssessmentPanel'
import { Modal } from './Modal'

type Props = {
  customerId: string
  jobs: Job[]
  candidate?: Candidate
  defaultJobId?: string
  latestAssessment?: CvAssessment
  onClose: () => void
  onSaved: () => void
  // Reloads board data without closing the form, e.g. after an AI assessment.
  onAssessed: () => void
}

// Accepts "linkedin.com/in/x" as well as full URLs.
function normalizeUrl(value: string) {
  const v = value.trim()
  if (!v) return ''
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}

export function CandidateForm({
  customerId,
  jobs,
  candidate,
  defaultJobId,
  latestAssessment,
  onClose,
  onSaved,
  onAssessed,
}: Props) {
  const firstOpenJob = jobs.find((j) => j.status === 'open') ?? jobs[0]
  const [jobId, setJobId] = useState(candidate?.job_id ?? defaultJobId ?? firstOpenJob?.id ?? '')
  const [fullName, setFullName] = useState(candidate?.full_name ?? '')
  const [email, setEmail] = useState(candidate?.email ?? '')
  const [phone, setPhone] = useState(candidate?.phone ?? '')
  const [linkedinUrl, setLinkedinUrl] = useState(candidate?.linkedin_url ?? '')
  const [stage, setStage] = useState<CandidateStage>(candidate?.stage ?? 'new')
  const [notes, setNotes] = useState(candidate?.notes ?? '')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [hasCv, setHasCv] = useState(!!candidate?.cv_filename)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleCvChange(file: File | undefined) {
    if (!file) return
    const problem = validateCv(file)
    setError(problem)
    setCvFile(problem ? null : file)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const fields = {
      job_id: jobId,
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      linkedin_url: normalizeUrl(linkedinUrl),
      stage,
      notes: notes.trim(),
    }
    const { data: saved, error } = candidate
      ? await supabase.from('candidates').update(fields).eq('id', candidate.id).select('id, customer_id').single()
      : await supabase
          .from('candidates')
          .insert({ ...fields, customer_id: customerId })
          .select('id, customer_id')
          .single()
    if (error || !saved) {
      setSaving(false)
      setError('Kunde inte spara kandidaten.')
      return
    }

    if (cvFile) {
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(cvPath(saved), cvFile, { upsert: true, contentType: 'application/pdf' })
      const { error: cvError } = uploadError
        ? { error: uploadError }
        : await supabase
            .from('candidates')
            .update({ cv_filename: cvFile.name, cv_uploaded_at: new Date().toISOString() })
            .eq('id', saved.id)
      if (cvError) {
        setSaving(false)
        setError('Kandidaten sparades men CV:t kunde inte laddas upp.')
        return
      }
    }
    setSaving(false)
    onSaved()
  }

  async function handleRemoveCv() {
    if (!candidate || !window.confirm('Ta bort CV:t?')) return
    await supabase.storage.from('cvs').remove([cvPath(candidate)])
    const { error } = await supabase
      .from('candidates')
      .update({ cv_filename: null, cv_uploaded_at: null })
      .eq('id', candidate.id)
    if (error) {
      setError('Kunde inte ta bort CV:t.')
      return
    }
    setHasCv(false)
    onAssessed()
  }

  async function handleDelete() {
    if (!candidate || !window.confirm(`Ta bort ${candidate.full_name}?`)) return
    const { error } = await supabase.from('candidates').delete().eq('id', candidate.id)
    if (error) {
      setError('Kunde inte ta bort kandidaten.')
      return
    }
    if (candidate.cv_filename) await supabase.storage.from('cvs').remove([cvPath(candidate)])
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
        <div>
          <span className="text-sm font-medium">CV (PDF, högst 5 MB)</span>
          {candidate && hasCv && !cvFile && (
            <div className="mt-1 flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200">
              <span className="truncate">{candidate.cv_filename}</span>
              <button type="button" onClick={() => openCv(candidate)} className="ml-auto text-indigo-600 hover:underline">
                Visa
              </button>
              <button type="button" onClick={handleRemoveCv} className="text-red-600 hover:underline">
                Ta bort
              </button>
            </div>
          )}
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => handleCvChange(e.target.files?.[0])}
            className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {candidate && hasCv && cvFile && <p className="mt-1 text-xs text-slate-500">Det nya CV:t ersätter det gamla när du sparar.</p>}
        </div>
        <label className="block">
          <span className="text-sm font-medium">Anteckningar</span>
          <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="input mt-1" />
        </label>
        {candidate && hasCv && !cvFile && (
          <CvAssessmentPanel candidate={candidate} assessment={latestAssessment} onAssessed={onAssessed} />
        )}
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
