import { apiRequest } from "./api";

export type Gender =
  | "male"
  | "female"
  | "other"
  | "prefer_not_to_say";

export interface User {
  id: number;
  name: string;
  age: number | null;
  gender: Gender | null;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterData {
  name: string;
  age: number;
  gender: Gender;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export async function registerUser(
  data: RegisterData,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function loginUser(
  data: LoginData,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>("/auth/me");
}