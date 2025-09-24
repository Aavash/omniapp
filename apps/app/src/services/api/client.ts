import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { config } from '@/utils/config';
import { STORAGE_KEYS, APP_CONSTANTS, ERROR_MESSAGES } from '@/utils/constants';
import { ApiError, ApiResponse } from '@/types/api';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: {
    resolve: (value: string) => void;
    reject: (error: unknown) => void;
  }[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: config.API_BASE_URL,
      timeout: APP_CONSTANTS.REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            this.processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            await this.clearTokens();
            // Navigate to login screen would be handled by auth context
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private processQueue(error: unknown, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else if (token) {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private async getStoredToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  private async refreshToken(): Promise<string> {
    try {
      const refreshToken = await SecureStore.getItemAsync(
        STORAGE_KEYS.REFRESH_TOKEN
      );
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${config.API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const { access_token } = response.data;
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, access_token);
      return access_token;
    } catch {
      throw new Error('Token refresh failed');
    }
  }

  private async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (clearError) {
      console.error('Error clearing tokens:', clearError);
    }
  }

  private handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        return {
          message:
            error.response.data?.detail ||
            error.response.data?.message ||
            ERROR_MESSAGES.SERVER_ERROR,
          status: error.response.status,
          code: error.response.data?.code,
          details: error.response.data,
        };
      } else if (error.request) {
        // Network error
        return {
          message: ERROR_MESSAGES.NETWORK_ERROR,
          status: 0,
          code: 'NETWORK_ERROR',
        };
      }
    }

    return {
      message: ERROR_MESSAGES.UNKNOWN_ERROR,
      status: 500,
      code: 'UNKNOWN_ERROR',
    };
  }

  // Public methods
  async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return {
      data: response.data,
      success: true,
    };
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<T> = await this.client.post(
      url,
      data,
      config
    );
    return {
      data: response.data,
      success: true,
    };
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return {
      data: response.data,
      success: true,
    };
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<T> = await this.client.patch(
      url,
      data,
      config
    );
    return {
      data: response.data,
      success: true,
    };
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return {
      data: response.data,
      success: true,
    };
  }
}

export const apiClient = new ApiClient();
