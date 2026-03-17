export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          avatar_url: string | null;
          total_points: number;
          current_streak: number;
          favorite_league: string | null;
          role: string;
          is_banned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname?: string;
          avatar_url?: string | null;
          total_points?: number;
          current_streak?: number;
          favorite_league?: string | null;
          role?: string;
          is_banned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nickname?: string;
          avatar_url?: string | null;
          total_points?: number;
          current_streak?: number;
          favorite_league?: string | null;
          role?: string;
          is_banned?: boolean;
          updated_at?: string;
        };
      };
      community_posts: {
        Row: {
          id: string;
          author_id: string;
          category: string;
          title: string;
          content: string;
          tags: string[];
          view_count: number;
          like_count: number;
          comment_count: number;
          is_pinned: boolean;
          is_hot: boolean;
          deleted_at: string | null;
          deleted_by: string | null;
          delete_reason: string | null;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          category: string;
          title: string;
          content: string;
          tags?: string[];
          view_count?: number;
          like_count?: number;
          comment_count?: number;
          is_pinned?: boolean;
          is_hot?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          delete_reason?: string | null;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          title?: string;
          content?: string;
          tags?: string[];
          view_count?: number;
          like_count?: number;
          comment_count?: number;
          is_pinned?: boolean;
          is_hot?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          delete_reason?: string | null;
          is_hidden?: boolean;
          updated_at?: string;
        };
      };
      community_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          parent_id: string | null;
          content: string;
          like_count: number;
          is_deleted: boolean;
          deleted_at: string | null;
          deleted_by: string | null;
          delete_reason: string | null;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          parent_id?: string | null;
          content: string;
          like_count?: number;
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          delete_reason?: string | null;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          like_count?: number;
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
          delete_reason?: string | null;
          is_hidden?: boolean;
          updated_at?: string;
        };
      };
      community_post_likes: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      community_post_reports: {
        Row: {
          id: string;
          reporter_id: string;
          post_id: string;
          reason: string;
          details: string | null;
          status: string;
          created_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          post_id: string;
          reason: string;
          details?: string | null;
          status?: string;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: {
          status?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
      };
      community_comment_reports: {
        Row: {
          id: string;
          reporter_id: string;
          comment_id: string;
          reason: string;
          details: string | null;
          status: string;
          created_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          comment_id: string;
          reason: string;
          details?: string | null;
          status?: string;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: {
          status?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
      };
      attendance_logs: {
        Row: {
          id: string;
          user_id: string;
          attendance_date: string;
          points_earned: number;
          streak_day: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          attendance_date: string;
          points_earned: number;
          streak_day: number;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
