import { useState } from 'react'
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

  if (!customerId) return <NoCustomer />

  const jobTitle = new Map(jobs.map((j) => [j.id, j.title]))

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Kandidater</h1>
        <button onClick={() => setEditing(null)} className="btn-primary">
          + Ny kandidat
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-4 grid auto-cols-[minmax(200px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
          {STAGES.map((stage) => {
            const inStage = candidates.filter((c) => c.stage === stage)
            return (
              <section key={stage} className="flex min-h-[60vh] flex-col rounded-lg bg-slate-100 p-2">
                <h2 className="flex items-center justify-between px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {stageLabel[stage]}
                  <span className="rounded-full bg-white px-1.5 py-0.5 text-slate-500">{inStage.length}</span>
                </h2>
                <div className="flex flex-col gap-1.5">
                  {inStage.map((c) => (
                    <CandidateCard key={c.id} candidate={c} jobTitle={jobTitle.get(c.job_id)} onOpen={() => setEditing(c)} />
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
