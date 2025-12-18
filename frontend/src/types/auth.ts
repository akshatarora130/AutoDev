export interface User {
  id: string;
  username: string;
  githubId: string;
  email?: string | null;
  avatarUrl?: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
