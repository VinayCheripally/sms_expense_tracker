export interface Database {
  public: {
    Tables: {
      expenses: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          merchant: string;
          category: string;
          timestamp: string;
          created_at: string;
          sms_text?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          merchant: string;
          category: string;
          timestamp: string;
          created_at?: string;
          sms_text?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          merchant?: string;
          category?: string;
          timestamp?: string;
          created_at?: string;
          sms_text?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Expense = Database['public']['Tables']['expenses']['Row'];
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];