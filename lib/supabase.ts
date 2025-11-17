import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string | null;
          email: string;
          full_name: string | null;
          role: 'admin' | 'manager' | 'user';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id?: string | null;
          email: string;
          full_name?: string | null;
          role?: 'admin' | 'manager' | 'user';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          email?: string;
          full_name?: string | null;
          role?: 'admin' | 'manager' | 'user';
          created_at?: string;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          position: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          position?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          position?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          organization_id: string;
          contact_id: string | null;
          title: string;
          description: string | null;
          status: 'new' | 'contacted' | 'qualified' | 'unqualified';
          source: string | null;
          value: number;
          assigned_to: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          contact_id?: string | null;
          title: string;
          description?: string | null;
          status?: 'new' | 'contacted' | 'qualified' | 'unqualified';
          source?: string | null;
          value?: number;
          assigned_to?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          contact_id?: string | null;
          title?: string;
          description?: string | null;
          status?: 'new' | 'contacted' | 'qualified' | 'unqualified';
          source?: string | null;
          value?: number;
          assigned_to?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      deals: {
        Row: {
          id: string;
          organization_id: string;
          contact_id: string | null;
          title: string;
          description: string | null;
          stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
          value: number;
          probability: number;
          expected_close_date: string | null;
          assigned_to: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          contact_id?: string | null;
          title: string;
          description?: string | null;
          stage?: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
          value?: number;
          probability?: number;
          expected_close_date?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          contact_id?: string | null;
          title?: string;
          description?: string | null;
          stage?: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
          value?: number;
          probability?: number;
          expected_close_date?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          organization_id: string;
          type: 'call' | 'email' | 'meeting' | 'task' | 'note';
          subject: string;
          description: string | null;
          status: 'pending' | 'completed' | 'cancelled';
          due_date: string | null;
          contact_id: string | null;
          lead_id: string | null;
          deal_id: string | null;
          assigned_to: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          type: 'call' | 'email' | 'meeting' | 'task' | 'note';
          subject: string;
          description?: string | null;
          status?: 'pending' | 'completed' | 'cancelled';
          due_date?: string | null;
          contact_id?: string | null;
          lead_id?: string | null;
          deal_id?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          type?: 'call' | 'email' | 'meeting' | 'task' | 'note';
          subject?: string;
          description?: string | null;
          status?: 'pending' | 'completed' | 'cancelled';
          due_date?: string | null;
          contact_id?: string | null;
          lead_id?: string | null;
          deal_id?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
