export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      vibe_checks: {
        Row: {
          id: string;
          user_id: string;
          score: number;
          analysis: string;
          factors: Json;
          photo_path: string | null;
          visibility: 'private' | 'friends' | 'public';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          score: number;
          analysis: string;
          factors: Json;
          photo_path?: string | null;
          visibility?: 'private' | 'friends' | 'public';
          created_at?: string;
        };
        Update: {
          score?: number;
          analysis?: string;
          factors?: Json;
          photo_path?: string | null;
          visibility?: 'private' | 'friends' | 'public';
        };
      };
      vibe_reactions: {
        Row: {
          id: string;
          vibe_check_id: string;
          user_id: string;
          reaction: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          vibe_check_id: string;
          user_id: string;
          reaction: string;
          created_at?: string;
        };
        Update: {
          reaction?: string;
        };
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
