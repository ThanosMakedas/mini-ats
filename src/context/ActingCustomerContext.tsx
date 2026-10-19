import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'
import { useAuth } from './AuthContext'

// Which customer's data the app is showing. A customer always sees their own data.
// An admin picks a customer and then works on their behalf.
type ActingCustomerValue = {
  customerId: string | null
  customer: Profile | null
  customers: Profile[]
  customersLoading: boolean
  customersError: string | null
  setCustomerId: (id: string) => void
  refreshCustomers: () => Promise<void>
}

const ActingCustomerContext = createContext<ActingCustomerValue | null>(null)
const STORAGE_KEY = 'mini-ats:acting-customer'

function readStoredId() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function ActingCustomerProvider({ children }: { children: ReactNode }) {
  const { profile, isAdmin } = useAuth()
  const [customers, setCustomers] = useState<Profile[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(readStoredId)
  const [customersLoaded, setCustomersLoaded] = useState(false)
  const [customersError, setCustomersError] = useState<string | null>(null)

  const refreshCustomers = useCallback(async () => {
    if (!isAdmin) return
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'customer').order('company_name')
    if (error) {
      setCustomersError('Kunde inte hämta kundkonton. Ladda om sidan och försök igen.')
    } else {
      setCustomersError(null)
      setCustomers(data)
    }
    setCustomersLoaded(true)
  }, [isAdmin])

  useEffect(() => {
    refreshCustomers()
  }, [refreshCustomers])

  function setCustomerId(id: string) {
    setSelectedId(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // Storage can be unavailable, the choice then lasts for this session only.
    }
  }

  let customer: Profile | null = null
  if (!isAdmin) customer = profile
  else customer = customers.find((c) => c.id === selectedId) ?? customers[0] ?? null

  const value: ActingCustomerValue = {
    customerId: customer?.id ?? null,
    customer,
    customers: isAdmin ? customers : profile ? [profile] : [],
    customersLoading: isAdmin && !customersLoaded,
    customersError: isAdmin ? customersError : null,
    setCustomerId,
    refreshCustomers,
  }

  return <ActingCustomerContext.Provider value={value}>{children}</ActingCustomerContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useActingCustomer() {
  const ctx = useContext(ActingCustomerContext)
  if (!ctx) throw new Error('useActingCustomer must be used inside ActingCustomerProvider')
  return ctx
}
