import type { ReactNode } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import type { CandidateStage } from '../lib/types'
import { stageLabel } from '../i18n/sv'

export function KanbanColumn({ stage, count, children }: { stage: CandidateStage; count: number; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[60vh] flex-col rounded-lg p-2 transition-colors ${
        isOver ? 'bg-indigo-100 ring-2 ring-indigo-300' : 'bg-slate-100'
      }`}
    >
      <h2 className="flex items-center justify-between px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
        {stageLabel[stage]}
        <span className="rounded-full bg-white px-1.5 py-0.5 text-slate-500">{count}</span>
      </h2>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  )
}

export function Draggable({ id, children }: { id: string; children: ReactNode }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id })

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={`touch-none ${isDragging ? 'opacity-30' : ''}`}>
      {children}
    </div>
  )
}
