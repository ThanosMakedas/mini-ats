import { Link } from 'react-router-dom'

// Shown to an admin who has not created any customer yet.
export function NoCustomer() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
      <p className="text-slate-600">Det finns inga kundkonton ännu.</p>
      <Link to="/admin/accounts" className="btn-primary mt-4">
        Skapa ett kundkonto
      </Link>
    </div>
  )
}
