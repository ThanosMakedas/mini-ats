import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './Spinner'

export function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { session, profile, isAdmin, loading } = useAuth()

  if (loading) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) {
    return <p className="p-8 text-center text-slate-600">Kontot saknar profil. Kontakta administratören.</p>
  }
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />

  return children
}
