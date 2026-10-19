import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const { session, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(await signIn(email, password))
    setSubmitting(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div>
          <h1 className="text-2xl font-semibold text-indigo-600">Mini-ATS</h1>
          <p className="mt-1 text-sm text-slate-500">Logga in för att hantera dina rekryteringar.</p>
        </div>
        <label className="block">
          <span className="text-sm font-medium">E-post</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input mt-1"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Lösenord</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input mt-1"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Loggar in...' : 'Logga in'}
        </button>
        <p className="text-xs text-slate-400">Saknar du konto? Kontakta din administratör.</p>
      </form>
    </main>
  )
}
