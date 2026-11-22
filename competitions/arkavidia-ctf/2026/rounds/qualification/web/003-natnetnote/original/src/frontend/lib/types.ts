export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  userId: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isDraft: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}