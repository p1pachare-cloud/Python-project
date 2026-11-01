/**
 * PyQuest Database Schema & Entity Types
 * Matches supabase/migrations/20261031000001_auth_profiles.sql
 */

export interface Profile {
  id: string;
  display_name: string;
  avatar_id: string;
  timezone: string;
  age_band: "adult";
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          display_name?: string;
          avatar_id?: string;
          timezone?: string;
          age_band?: "adult";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_id?: string;
          timezone?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
