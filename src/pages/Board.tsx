import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { supabase } from '../lib/supabase'
import type { Candidate, CandidateStage } from '../lib/types'
import { STAGES } from '../i18n/sv'
import { useActingCustomer } from '../context/ActingCustomerContext'
import { useCustomerData } from '../hooks/useCustomerData'
import { CandidateCard } from '../components/CandidateCard'
import { CandidateForm } from '../components/CandidateForm'
import { Draggable, KanbanColumn } from '../components/KanbanColumn'
import { NoCustomer } from '../components/NoCustomer'
import { Spinner } from '../components/Spinner'

export function Board() {
  const { customerId } = useActingCustomer()
  const { jobs, candidates, setCandidates, loading, error, reload } = useCustomerData(customerId)
  // undefined = closed, null = new candidate, Candidate = editing
  const [editing, setEditing] = useState<Candidate | null | undefined>(undefined)
  const [searchParams, setSearchParams] = useSearchParams()
  const jobFilter = searchParams.get('job') ?? ''
  const query = searchParams.get('q') ?? ''
  const [dragged, setDragged] = useState<Candidate | null>(null)
  const [moveError, setMoveError] = useState<string | null>(null)
  // A small distance keeps a plain click working for opening the card.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

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

  function handleDragStart(e: DragStartEvent) {
    setDragged(candidates.find((c) => c.id === e.active.id) ?? null)
  }

  async function handleDragEnd(e: DragEndEvent) {
    setDragged(null)
    const candidate = candidates.find((c) => c.id === e.active.id)
    const stage = e.over?.id as CandidateStage | undefined
    if (!candidate || !stage || candidate.stage === stage) return

    // Move the card right away, then save. Roll back if saving fails.
    setCandidates((prev) => prev.map((c) => (c.id === candidate.id ? { ...c, stage } : c)))
    const { error } = await supabase.from('candidates').update({ stage }).eq('id', candidate.id)
    if (error) {
      setMoveError('Kunde inte flytta kandidaten.')
      setCandidates((prev) => prev.map((c) => (c.id === candidate.id ? { ...c, stage: candidate.stage } : c)))
    } else {
      setMoveError(null)
    }
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

      {(error || moveError) && <p className="mt-4 text-sm text-red-600">{error ?? moveError}</p>}
      {loading ? (
        <Spinner />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setDragged(null)}
        >
          <div className="mt-4 grid auto-cols-[minmax(200px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
            {STAGES.map((stage) => {
              const inStage = visible.filter((c) => c.stage === stage)
              return (
                <KanbanColumn key={stage} stage={stage} count={inStage.length}>
                  {inStage.map((c) => (
                    <Draggable key={c.id} id={c.id}>
                      <CandidateCard
                        candidate={c}
                        jobTitle={activeJobId ? undefined : jobTitle.get(c.job_id)}
                        onOpen={() => setEditing(c)}
                      />
                    </Draggable>
                  ))}
                </KanbanColumn>
              )
            })}
          </div>
          <DragOverlay>
            {dragged && (
              <div className="rotate-2 shadow-lg">
                <CandidateCard
                  candidate={dragged}
                  jobTitle={activeJobId ? undefined : jobTitle.get(dragged.job_id)}
                  onOpen={() => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
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
