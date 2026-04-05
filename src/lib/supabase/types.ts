export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      households: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          invite_code?: string;
          owner_id?: string;
        };
        Relationships: [];
      };
      household_members: {
        Row: {
          household_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          household_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
        };
        Update: {
          role?: string;
        };
        Relationships: [];
      };
      shopping_lists: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          is_active: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          is_active?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      list_items: {
        Row: {
          id: string;
          list_id: string;
          name: string;
          quantity: number;
          unit: string | null;
          category: string;
          is_purchased: boolean;
          purchased_by: string | null;
          purchased_at: string | null;
          added_by: string;
          recipe_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          name: string;
          quantity?: number;
          unit?: string | null;
          category?: string;
          is_purchased?: boolean;
          purchased_by?: string | null;
          purchased_at?: string | null;
          added_by: string;
          recipe_id?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          quantity?: number;
          unit?: string | null;
          category?: string;
          is_purchased?: boolean;
          purchased_by?: string | null;
          purchased_at?: string | null;
        };
        Relationships: [];
      };
      recipes: {
        Row: {
          id: string;
          household_id: string;
          title: string;
          source_url: string | null;
          servings: number;
          notes: string | null;
          added_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          title: string;
          source_url?: string | null;
          servings?: number;
          notes?: string | null;
          added_by: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          source_url?: string | null;
          servings?: number;
          notes?: string | null;
        };
        Relationships: [];
      };
      recipe_ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          name: string;
          quantity: number;
          unit: string | null;
          category: string;
          position: number;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          name: string;
          quantity: number;
          unit?: string | null;
          category?: string;
          position?: number;
        };
        Update: {
          name?: string;
          quantity?: number;
          unit?: string | null;
          category?: string;
          position?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      join_household: {
        Args: { code: string };
        Returns: {
          id: string;
          name: string;
          invite_code: string;
          owner_id: string;
          created_at: string;
        };
      };
      generate_invite_code: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
  };
}
