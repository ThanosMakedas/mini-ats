import type { CandidateStage, JobStatus, UserRole } from '../lib/types'

// Kanban columns in pipeline order.
export const STAGES: CandidateStage[] = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected']

export const stageLabel: Record<CandidateStage, string> = {
  new: 'Ny',
  screening: 'Screening',
  interview: 'Intervju',
  offer: 'Erbjudande',
  hired: 'Anställd',
  rejected: 'Avböjd',
}

export const jobStatusLabel: Record<JobStatus, string> = {
  open: 'Öppen',
  closed: 'Stängd',
}

export const roleLabel: Record<UserRole, string> = {
  admin: 'Admin',
  customer: 'Kund',
}

// AI assessment scale, see the assess-cv edge function.
export const scoreLabel: Record<number, string> = {
  1: 'Matchar inte',
  2: 'Svag matchning',
  3: 'Delvis matchning',
  4: 'God matchning',
  5: 'Mycket god matchning',
}
