// API types
export interface APIError {
  error: string;
  message?: string;
  code?: number;
}

export interface APIResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

