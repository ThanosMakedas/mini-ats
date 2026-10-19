import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Candidate } from '../lib/types'
import { STAGES, stageLabel } from '../i18n/sv'
import { useActingCustomer } from '../context/ActingCustomerContext'
import { useCustomerData } from '../hooks/useCustomerData'
import { CandidateCard } from '../components/CandidateCard'
import { CandidateForm } from '../components/CandidateForm'
import { NoCustomer } from '../components/NoCustomer'
import { Spinner } from '../components/Spinner'

export function Board() {
  const { customerId } = useActingCustomer()
  const { jobs, candidates, loading, error, reload } = useCustomerData(customerId)
  // undefined = closed, null = new candidate, Candidate = editing
  const [editing, setEditing] = useState<Candidate | null | undefined>(undefined)
  const [searchParams, setSearchParams] = useSearchParams()
  const jobFilter = searchParams.get('job') ?? ''
  const query = searchParams.get('q') ?? ''

  if (!customerId) return <NoCustomer />

  const jobTitle = new Map(jobs.map((j) => [j.id, j.title]))
  // Ignore a job filter that belongs to another customer, e.g. after an admin switches customer.
  const activeJobId = jobFilter && jobTitle.has(jobFilter) ? jobFilter : ''
  const needle = query.trim().toLocaleLowerCase('sv')
  const visible = candidates.filter(
    (c) => (!activeJobId || c.job_id === activeJobId) && (!needle || c.full_name.toLocaleLowerCase('sv').includes(needle)),
  )

  function setFilter(key: 'job' | 'q', value: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Kandidater</h1>
        <select value={activeJobId} onChange={(e) => setFilter('job', e.target.value)} className="input w-auto" aria-label="Filtrera på jobb">
          <option value="">Alla jobb</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
              {j.status === 'closed' ? ' (stängd)' : ''}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={query}
          onChange={(e) => setFilter('q', e.target.value)}
          placeholder="Sök kandidatnamn..."
          className="input w-56"
          aria-label="Sök kandidatnamn"
        />
        {(activeJobId || query) && (
          <span className="text-sm text-slate-500">
            {visible.length} av {candidates.length}
          </span>
        )}
        <button onClick={() => setEditing(null)} className="btn-primary ml-auto">
          + Ny kandidat
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-4 grid auto-cols-[minmax(200px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
          {STAGES.map((stage) => {
            const inStage = visible.filter((c) => c.stage === stage)
            return (
              <section key={stage} className="flex min-h-[60vh] flex-col rounded-lg bg-slate-100 p-2">
                <h2 className="flex items-center justify-between px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {stageLabel[stage]}
                  <span className="rounded-full bg-white px-1.5 py-0.5 text-slate-500">{inStage.length}</span>
                </h2>
                <div className="flex flex-col gap-1.5">
                  {inStage.map((c) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      jobTitle={activeJobId ? undefined : jobTitle.get(c.job_id)}
                      onOpen={() => setEditing(c)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {editing !== undefined && (
        <CandidateForm
          customerId={customerId}
          jobs={jobs}
          candidate={editing ?? undefined}
          defaultJobId={activeJobId || undefined}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined)
            reload()
          }}
        />
      )}
    </div>
  )
}
