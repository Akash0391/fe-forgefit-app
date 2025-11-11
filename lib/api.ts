const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    allow401: boolean = false
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session-based auth
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Handle 401 (Unauthorized) gracefully if allowed
        if (response.status === 401 && allow401) {
          const errorData = await response.json().catch(() => ({ 
            success: false,
            message: 'Not authenticated' 
          }));
          throw { status: 401, data: errorData };
        }
        
        const error = await response.json().catch(() => ({ 
          error: 'An error occurred' 
        }));
        throw new Error(error.error || error.message || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      // Re-throw 401 errors if allow401 is true
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async get<T>(endpoint: string, allow401: boolean = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, allow401);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_URL);

