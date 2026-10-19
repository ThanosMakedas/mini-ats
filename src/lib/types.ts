import type { Database } from './database.types'

type Tables = Database['public']['Tables']

export type Profile = Tables['profiles']['Row']
export type Job = Tables['jobs']['Row']
export type Candidate = Tables['candidates']['Row']

export type UserRole = Database['public']['Enums']['user_role']
export type JobStatus = Database['public']['Enums']['job_status']
export type CandidateStage = Database['public']['Enums']['candidate_stage']
