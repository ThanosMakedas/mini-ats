import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './Spinner'

export function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { session, profile, profileError, isAdmin, loading, signOut } = useAuth()

  if (loading) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) {
    return (
      <div className="p-8 text-center text-slate-600">
        <p>{profileError ?? 'Kontot saknar profil. Kontakta administratören.'}</p>
        <div className="mt-4 flex justify-center gap-2">
          {profileError && (
            <button onClick={() => window.location.reload()} className="btn-primary">
              Försök igen
            </button>
          )}
          <button onClick={signOut} className="btn-secondary">
            Logga ut
          </button>
        </div>
      </div>
    )
  }
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />

  return children
}
