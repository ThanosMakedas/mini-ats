import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { generatePassword, invokeFunction } from '../../lib/functions'
import type { Profile, UserRole } from '../../lib/types'
import { roleLabel } from '../../i18n/sv'
import { useActingCustomer } from '../../context/ActingCustomerContext'
import { Spinner } from '../../components/Spinner'

type Created = { email: string; password: string; role: UserRole }

export function Accounts() {
  const { refreshCustomers } = useActingCustomer()
  const [accounts, setAccounts] = useState<Profile[] | null>(null)

  const [role, setRole] = useState<UserRole>('customer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState(generatePassword)
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<Created | null>(null)

  const loadAccounts = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setAccounts(data ?? [])
  }, [])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await invokeFunction('create-user', {
      email,
      password,
      role,
      full_name: fullName,
      company_name: role === 'customer' ? companyName : '',
    })
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    setCreated({ email, password, role })
    setEmail('')
    setFullName('')
    setCompanyName('')
    setPassword(generatePassword())
    await Promise.all([loadAccounts(), refreshCustomers()])
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <section className="h-fit rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold">Skapa konto</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="flex gap-2">
            {(['customer', 'admin'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 rounded-md border px-3 py-1.5 text-sm font-medium ${
                  role === r ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-300 text-slate-600'
                }`}
              >
                {r === 'customer' ? 'Kundkonto' : 'Adminkonto'}
              </button>
            ))}
          </div>
          {role === 'customer' && (
            <label className="block">
              <span className="text-sm font-medium">Företag</span>
              <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input mt-1" />
            </label>
          )}
          <label className="block">
            <span className="text-sm font-medium">Namn</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input mt-1" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">E-post</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input mt-1" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Lösenord</span>
            <div className="mt-1 flex gap-2">
              <input
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input font-mono"
              />
              <button type="button" onClick={() => setPassword(generatePassword())} className="btn-secondary">
                Generera
              </button>
            </div>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Skapar...' : 'Skapa konto'}
          </button>
        </form>

        {created && (
          <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm ring-1 ring-emerald-200">
            <p className="font-medium text-emerald-800">{roleLabel[created.role]}konto skapat. Dela inloggningen:</p>
            <p className="mt-1 font-mono text-emerald-900">{created.email}</p>
            <p className="font-mono text-emerald-900">{created.password}</p>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}\n${created.email}\n${created.password}`)}
              className="mt-2 text-emerald-700 underline"
            >
              Kopiera
            </button>
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <h2 className="px-6 pt-5 text-lg font-semibold">Konton</h2>
        {!accounts ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="mt-3 w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-2 font-medium">Företag</th>
                  <th className="px-6 py-2 font-medium">Namn</th>
                  <th className="px-6 py-2 font-medium">E-post</th>
                  <th className="px-6 py-2 font-medium">Roll</th>
                  <th className="px-6 py-2 font-medium">Skapad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td className="px-6 py-2.5">{a.company_name ?? '-'}</td>
                    <td className="px-6 py-2.5">{a.full_name || '-'}</td>
                    <td className="px-6 py-2.5">{a.email}</td>
                    <td className="px-6 py-2.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs ${
                          a.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {roleLabel[a.role]}
                      </span>
                    </td>
                    <td className="px-6 py-2.5 text-slate-500">{new Date(a.created_at).toLocaleDateString('sv-SE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
