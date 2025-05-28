
export type MatchTransaction = {
  id: string;
  customer_id: string;
  machine_id: string;
  employee_id: string | null;
  created_by: string;
  initial_amount: number;
  match_percentage: number;
  matched_amount: number;
  total_credits: number;
  redemption_threshold: number;
  status: string;
  notes?: string;
  created_at: string;
  redeemed_at?: string;
  customer?: {
    first_name: string;
    last_name: string;
  };
  machine?: {
    name: string;
  };
  employee?: {
    first_name: string;
    last_name: string;
  };
};

// Add a type to make the match_transactions table accessible through supabase client
declare module '@supabase/supabase-js' {
  interface Database {
    public: {
      Tables: {
        match_transactions: {
          Row: {
            id: string;
            customer_id: string;
            machine_id: string;
            employee_id: string | null;
            created_by: string;
            initial_amount: number;
            match_percentage: number;
            matched_amount: number;
            total_credits: number;
            redemption_threshold: number;
            status: string;
            notes?: string;
            created_at: string;
            redeemed_at?: string;
          };
        };
      };
    };
  }
}
