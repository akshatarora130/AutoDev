import { type User } from "@prisma/client";

export type { User };

export interface AuthUser {
  id: string;
  username: string;
  githubId: string;
  email?: string | null;
  avatarUrl?: string | null;
}

export interface GitHubProfile {
  id: string;
  username: string;
  displayName?: string;
  emails?: Array<{ value: string }>;
  photos?: Array<{ value: string }>;
}
