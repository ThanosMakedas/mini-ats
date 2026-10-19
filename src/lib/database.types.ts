// Types for the Supabase schema in supabase/migrations.
// Regenerate with: npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: Database['public']['Enums']['user_role']
          full_name: string
          company_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: Database['public']['Enums']['user_role']
          full_name?: string
          company_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: Database['public']['Enums']['user_role']
          full_name?: string
          company_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          id: string
          customer_id: string
          title: string
          description: string
          location: string
          status: Database['public']['Enums']['job_status']
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          title: string
          description?: string
          location?: string
          status?: Database['public']['Enums']['job_status']
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          title?: string
          description?: string
          location?: string
          status?: Database['public']['Enums']['job_status']
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'jobs_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      candidates: {
        Row: {
          id: string
          customer_id: string
          job_id: string
          full_name: string
          email: string
          phone: string
          linkedin_url: string
          notes: string
          stage: Database['public']['Enums']['candidate_stage']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          job_id: string
          full_name: string
          email?: string
          phone?: string
          linkedin_url?: string
          notes?: string
          stage?: Database['public']['Enums']['candidate_stage']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          job_id?: string
          full_name?: string
          email?: string
          phone?: string
          linkedin_url?: string
          notes?: string
          stage?: Database['public']['Enums']['candidate_stage']
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'candidates_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'candidates_job_id_customer_id_fkey'
            columns: ['job_id', 'customer_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id', 'customer_id']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
    }
    Enums: {
      user_role: 'admin' | 'customer'
      job_status: 'open' | 'closed'
      candidate_stage: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'
    }
    CompositeTypes: { [_ in never]: never }
  }
}
