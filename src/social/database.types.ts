export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          reporter_id: string
          vibe_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id: string
          vibe_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id?: string
          vibe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_vibe_id_fkey"
            columns: ["vibe_id"]
            isOneToOne: false
            referencedRelation: "vibes"
            referencedColumns: ["id"]
          },
        ]
      }
      vibes: {
        Row: {
          analysis: string
          created_at: string
          factors: Json
          id: string
          photo_path: string | null
          score: number
          user_id: string
        }
        Insert: {
          analysis?: string
          created_at?: string
          factors?: Json
          id?: string
          photo_path?: string | null
          score: number
          user_id: string
        }
        Update: {
          analysis?: string
          created_at?: string
          factors?: Json
          id?: string
          photo_path?: string | null
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vibes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
