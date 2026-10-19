import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Job } from '../lib/types'
import { jobStatusLabel } from '../i18n/sv'
import { useActingCustomer } from '../context/ActingCustomerContext'
import { useCustomerData } from '../hooks/useCustomerData'
import { JobForm } from '../components/JobForm'
import { NoCustomer } from '../components/NoCustomer'
import { Spinner } from '../components/Spinner'

export function Jobs() {
  const { customerId } = useActingCustomer()
  const { jobs, candidates, loading, error, reload } = useCustomerData(customerId)
  // undefined = closed, null = new job, Job = editing that job
  const [editing, setEditing] = useState<Job | null | undefined>(undefined)

  if (!customerId) return <NoCustomer />

  const countFor = (jobId: string) => candidates.filter((c) => c.job_id === jobId).length

  async function toggleStatus(job: Job) {
    await supabase
      .from('jobs')
      .update({ status: job.status === 'open' ? 'closed' : 'open' })
      .eq('id', job.id)
    reload()
  }

  async function remove(job: Job) {
    const count = countFor(job.id)
    const warning = count > 0 ? ` Det tar även bort ${count} kandidat(er).` : ''
    if (!window.confirm(`Ta bort "${job.title}"?${warning}`)) return
    await supabase.from('jobs').delete().eq('id', job.id)
    reload()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Jobb</h1>
        <button onClick={() => setEditing(null)} className="btn-primary">
          + Nytt jobb
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <Spinner />
      ) : jobs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-600">
          Inga jobb ännu. Lägg upp det första jobbet du söker kandidater till.
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <li key={job.id} className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{job.title}</h2>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    job.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {jobStatusLabel[job.status]}
                </span>
              </div>
              {job.location && <p className="mt-0.5 text-sm text-slate-500">{job.location}</p>}
              {job.description && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{job.description}</p>}
              <div className="mt-auto flex flex-wrap items-center gap-1 pt-4">
                <Link to={`/board?job=${job.id}`} className="mr-auto text-sm font-medium text-indigo-600 hover:underline">
                  {countFor(job.id)} kandidater &rarr;
                </Link>
                <button onClick={() => setEditing(job)} className="btn-secondary px-2 py-1">
                  Redigera
                </button>
                <button onClick={() => toggleStatus(job)} className="btn-secondary px-2 py-1">
                  {job.status === 'open' ? 'Stäng' : 'Öppna'}
                </button>
                <button onClick={() => remove(job)} className="btn-danger px-2 py-1">
                  Ta bort
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing !== undefined && (
        <JobForm
          customerId={customerId}
          job={editing ?? undefined}
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
