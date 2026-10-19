import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Candidate, CvAssessment, Job } from '../lib/types'

// Loads the jobs, candidates and CV assessments of one customer. Admins can read every customer,
// so the customer filter is always applied explicitly and not left to RLS.
export function useCustomerData(customerId: string | null) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [assessments, setAssessments] = useState<CvAssessment[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Only the newest request may update state, so a slow answer for a previous customer is ignored.
  const latestRequest = useRef(0)

  const reload = useCallback(async () => {
    if (!customerId) return
    const requestId = ++latestRequest.current
    const [jobsRes, candidatesRes, assessmentsRes] = await Promise.all([
      supabase.from('jobs').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('candidates').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('cv_assessments').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
    ])
    if (requestId !== latestRequest.current) return

    if (jobsRes.error || candidatesRes.error || assessmentsRes.error) {
      // Never keep showing another customer's rows under this customer.
      setError('Kunde inte hämta data. Ladda om sidan och försök igen.')
      setJobs([])
      setCandidates([])
      setAssessments([])
    } else {
      setError(null)
      setJobs(jobsRes.data)
      setCandidates(candidatesRes.data)
      setAssessments(assessmentsRes.data)
    }
    setLoadedFor(customerId)
  }, [customerId])

  useEffect(() => {
    reload()
  }, [reload])

  // Newest assessment per candidate. The list is sorted newest first, so the first hit wins.
  const latestAssessment = useMemo(() => {
    const map = new Map<string, CvAssessment>()
    for (const a of assessments) if (!map.has(a.candidate_id)) map.set(a.candidate_id, a)
    return map
  }, [assessments])

  return {
    jobs,
    candidates,
    setCandidates,
    latestAssessment,
    loading: !!customerId && loadedFor !== customerId,
    error,
    reload,
  }
}
