import { Link } from 'react-router-dom'
import { useActingCustomer } from '../context/ActingCustomerContext'

// Lets an admin choose which customer to work on behalf of.
export function CustomerSwitcher() {
  const { customers, customerId, setCustomerId } = useActingCustomer()

  if (customers.length === 0) {
    return (
      <Link to="/admin/accounts" className="text-sm text-amber-700 underline">
        Skapa ett kundkonto först
      </Link>
    )
  }

  return (
    <label className="flex items-center gap-2 rounded-md bg-amber-50 px-2 py-1 text-sm ring-1 ring-amber-200">
      <span className="font-medium text-amber-800">Agerar som</span>
      <select
        value={customerId ?? ''}
        onChange={(e) => setCustomerId(e.target.value)}
        className="rounded border-amber-300 bg-white px-1 py-0.5 text-sm"
      >
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.company_name || c.email}
          </option>
        ))}
      </select>
    </label>
  )
}
