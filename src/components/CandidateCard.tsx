import type { Candidate } from '../lib/types'

type Props = {
  candidate: Candidate
  jobTitle?: string
  onOpen: () => void
}

export function CandidateCard({ candidate, jobTitle, onOpen }: Props) {
  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer rounded-md bg-white px-2.5 py-2 text-sm shadow-xs ring-1 ring-slate-200 hover:ring-indigo-300"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium">{candidate.full_name}</span>
        {candidate.linkedin_url && (
          <a
            href={candidate.linkedin_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="shrink-0 text-slate-400 hover:text-[#0a66c2]"
            aria-label={`LinkedIn: ${candidate.full_name}`}
            title="Öppna LinkedIn"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
            </svg>
          </a>
        )}
      </div>
      {jobTitle && <p className="mt-0.5 truncate text-xs text-slate-500">{jobTitle}</p>}
    </div>
  )
}
