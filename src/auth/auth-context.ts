import { createContext } from "react";

export type AuthMode = "firebase" | "local";

export interface AuthUser {
  email: string;
  name: string;
  role: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthContextValue {
  authMode: AuthMode;
  authNotice: string;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  requestPasswordReset: (email: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  user: AuthUser | null;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
