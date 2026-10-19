import { useState } from 'react'
import { invokeFunction } from '../lib/functions'
import type { Candidate, CvAssessment } from '../lib/types'
import { scoreLabel } from '../i18n/sv'
import { ScoreBadge } from './ScoreBadge'

type Props = {
  candidate: Candidate
  assessment?: CvAssessment
  onAssessed: () => void
}

// Shows the latest AI assessment of a candidate's CV and lets the user run a new one.
export function CvAssessmentPanel({ candidate, assessment: initial, onAssessed }: Props) {
  const [assessment, setAssessment] = useState(initial)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const outdated =
    assessment && candidate.cv_uploaded_at && new Date(candidate.cv_uploaded_at) > new Date(assessment.created_at)

  async function run() {
    setRunning(true)
    setError(null)
    const { data, error } = await invokeFunction<CvAssessment>('assess-cv', { candidate_id: candidate.id })
    setRunning(false)
    if (error || !data) {
      setError(error ?? 'Något gick fel. Försök igen.')
      return
    }
    setAssessment(data)
    onAssessed()
  }

  return (
    <section className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-indigo-900">AI-bedömning av CV</h3>
        <button type="button" onClick={run} disabled={running} className="btn-secondary px-2 py-1 text-xs">
          {running ? 'Bedömer...' : assessment ? 'Bedöm igen' : 'Bedöm CV med AI'}
        </button>
      </div>

      {running && <p className="mt-2 text-xs text-slate-500">AI:n läser CV:t och jämför det med jobbet. Det tar oftast 10-30 sekunder.</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {!assessment && !running && (
        <p className="mt-2 text-xs text-slate-600">
          AI:n jämför CV:t med jobbets beskrivning och ger ett betyg 1-5 med styrkor och luckor.
        </p>
      )}

      {assessment && (
        <div className="mt-3 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <ScoreBadge score={assessment.score} large />
            <span className="font-medium">{scoreLabel[assessment.score]}</span>
          </div>
          <p className="text-slate-700">{assessment.summary}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Styrkor</h4>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-700">
                {assessment.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700">Luckor</h4>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-700">
                {assessment.gaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
          </div>
          {outdated && <p className="text-xs font-medium text-amber-700">CV:t har bytts sedan bedömningen. Bedöm igen för ett aktuellt resultat.</p>}
          <p className="text-xs text-slate-400">
            Bedömd {new Date(assessment.created_at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}.
            AI-bedömningen är ett stöd för rekryteraren, inte ett beslut.
          </p>
        </div>
      )}
    </section>
  )
}
