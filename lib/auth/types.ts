export type UserRole = "user" | "moderator" | "admin";
export type AuthProvider = "email" | "google" | "kakao" | "naver";

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  role: UserRole;
  points: number;
  level: number;
  provider: AuthProvider;
  favoriteLeague?: string;
  favoriteTeam?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: UserProfile;
  accessToken?: string;
  expiresAt?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  nickname: string;
}
