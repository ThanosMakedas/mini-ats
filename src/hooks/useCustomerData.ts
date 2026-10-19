import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Candidate, Job } from '../lib/types'

// Loads the jobs and candidates of one customer. Admins can read every customer,
// so the customer filter is always applied explicitly and not left to RLS.
export function useCustomerData(customerId: string | null) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!customerId) return
    const [jobsRes, candidatesRes] = await Promise.all([
      supabase.from('jobs').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('candidates').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
    ])
    if (jobsRes.error || candidatesRes.error) {
      setError('Kunde inte hämta data.')
    } else {
      setError(null)
      setJobs(jobsRes.data)
      setCandidates(candidatesRes.data)
    }
    setLoadedFor(customerId)
  }, [customerId])

  useEffect(() => {
    reload()
  }, [reload])

  return {
    jobs,
    candidates,
    setCandidates,
    loading: !!customerId && loadedFor !== customerId,
    error,
    reload,
  }
}
