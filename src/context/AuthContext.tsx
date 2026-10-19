import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

type AuthContextValue = {
  session: Session | null
  profile: Profile | null
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  // The user id whose profile fetch has finished, so we know when the profile is up to date.
  const [profileLoadedFor, setProfileLoadedFor] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionLoading(false)
    })
    // Only store the session here. Calling Supabase inside this callback can deadlock the auth client.
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (!userId) {
      setProfile(null)
      return
    }
    let cancelled = false
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setProfile(data)
        setProfileLoadedFor(userId)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? 'Fel e-post eller lösenord.' : null
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value: AuthContextValue = {
    session,
    profile,
    isAdmin: profile?.role === 'admin',
    loading: sessionLoading || (!!userId && profileLoadedFor !== userId),
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
