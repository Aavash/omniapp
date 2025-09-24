import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, QueryParams } from '@/types/api';

export abstract class BaseApiService {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  protected buildUrl(endpoint: string, params?: QueryParams): string {
    const url = `${this.baseUrl}${endpoint}`;
    
    if (!params) return url;

    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          searchParams.append(key, JSON.stringify(value));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  protected async get<T>(endpoint: string, params?: QueryParams): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, params);
    return apiClient.get<T>(url);
  }

  protected async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    return apiClient.post<T>(url, data);
  }

  protected async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    return apiClient.put<T>(url, data);
  }

  protected async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    return apiClient.patch<T>(url, data);
  }

  protected async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    return apiClient.delete<T>(url);
  }

  // Common CRUD operations
  protected async getById<T>(id: number): Promise<ApiResponse<T>> {
    return this.get<T>(`/${id}`);
  }

  protected async getAll<T>(params?: QueryParams): Promise<ApiResponse<T[]>> {
    return this.get<T[]>('', params);
  }

  protected async getPaginated<T>(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<T>>> {
    return this.get<PaginatedResponse<T>>('', params);
  }

  protected async create<T>(data: unknown): Promise<ApiResponse<T>> {
    return this.post<T>('', data);
  }

  protected async updateById<T>(id: number, data: unknown): Promise<ApiResponse<T>> {
    return this.put<T>(`/${id}`, data);
  }

  protected async patchById<T>(id: number, data: unknown): Promise<ApiResponse<T>> {
    return this.patch<T>(`/${id}`, data);
  }

  protected async deleteById<T>(id: number): Promise<ApiResponse<T>> {
    return this.delete<T>(`/${id}`);
  }
}