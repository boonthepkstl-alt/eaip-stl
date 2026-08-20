// User types
export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'user' | 'manager';
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
