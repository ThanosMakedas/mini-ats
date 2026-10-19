import { Link } from 'react-router-dom'
import { useActingCustomer } from '../context/ActingCustomerContext'
import { Spinner } from './Spinner'

// Shown while no customer is selected: the admin's customer list is still loading,
// failed to load, or there are no customer accounts yet.
export function NoCustomer() {
  const { customersLoading, customersError } = useActingCustomer()

  if (customersLoading) return <Spinner />
  if (customersError) return <p className="text-sm text-red-600">{customersError}</p>

  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
      <p className="text-slate-600">Det finns inga kundkonton ännu.</p>
      <Link to="/admin/accounts" className="btn-primary mt-4">
        Skapa ett kundkonto
      </Link>
    </div>
  )
}
