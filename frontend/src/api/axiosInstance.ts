import axios from 'axios';

let accessToken: string | null = null;

export function getAccessTokenFromMemory(): string | null {
  return accessToken;
}

export function setAccessTokenInMemory(token: string | null) {
  accessToken = token;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

api.interceptors.request.use(config => {
  const token = getAccessTokenFromMemory();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

let onAuthFailure: (() => void) | null = null;
export function registerAuthFailureCallback(callback: () => void) {
  onAuthFailure = callback;
}

export async function refreshAccessToken(): Promise<string> {
  try {
    // Call the refresh endpoint to obtain a new access token
    const response = await axios.post<{ accessToken: string }>(
      (import.meta.env.VITE_API_BASE_URL) + '/auth/refresh',
      {},
      { withCredentials: true }
    );
    const newToken = response.data.accessToken;
    setAccessTokenInMemory(newToken);
    return newToken;
  } catch (error) {
    setAccessTokenInMemory(null);
    // Only trigger global auth failure if the server explicitly rejected us (e.g. 401)
    if (error && typeof error === 'object' && 'response' in error) {
      const err = error as { response?: { status?: number } };
      if (err.response && err.response.status && err.response.status >= 400 && err.response.status < 500) {
        if (onAuthFailure) {
          onAuthFailure();
        }
      }
    }
    throw error;
  }
}

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    // Don't retry auth endpoints to prevent loops
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url?.includes('/auth/login') && 
      !originalRequest.url?.includes('/auth/forgot-password') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/contact')
    ) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
