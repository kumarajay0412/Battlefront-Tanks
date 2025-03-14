import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://actrqkmfmfhnlcrwqdcg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdHJxa21mbWZobmxjcndxZGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NjU3MDIsImV4cCI6MjA1NzU0MTcwMn0.EwSOnvxHWxBXMVRnzDimyfZiQx-AMpPSestZ7KarnXs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export type Database = {
  public: {
    Tables: {
      scores: {
        Row: {
          id: number
          user_name: string
          score: number
          created_at: string
        }
        Insert: {
          user_name: string
          score: number
        }
      }
    }
  }
} 