import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://superapp-backend-grtx.onrender.com';

export const api = axios.create({
  baseURL: API_URL,
});

// Agregar token a cada request automáticamente
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface MiniApp {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  color: number;
  enabled: boolean;
  permissions: string[];
  bundle_url: string;
  version: string;
  category: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  role: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get<User>('/auth/me'),
};

export const registryApi = {
  getApps: () => api.get<{ apps: MiniApp[]; total: number }>('/registry/admin/all'),
  toggle: (id: string) => api.put(`/registry/${id}/toggle`),
  create: (app: Partial<MiniApp>) => api.post('/registry', app),
};

export const versionsApi = {
  getVersions: (appId: string) =>
    api.get<{ versions: any[] }>(`/registry/${appId}/versions`),
  rollback: (appId: string, versionId: number) =>
    api.post(`/registry/${appId}/rollback/${versionId}`),
};

export interface Environment {
  id: number;
  app_id: string;
  environment: 'development' | 'sandbox' | 'production';
  bundle_url: string;
  version: string;
  status: 'inactive' | 'building' | 'ready' | 'failed';
  deployed_at: string | null;
  deployed_by: string | null;
  commit_sha: string | null;
  qr_token: string | null;
}

export const environmentsApi = {
  getEnvironments: (appId: string) =>
    api.get<{ environments: Environment[] }>(`/environments/${appId}`),
  deploy: (appId: string, environment: string) =>
    api.post(`/environments/${appId}/deploy`, { environment }),
  promote: (appId: string, from: string, to: string) =>
    api.post(`/environments/${appId}/promote`, { from, to }),
  generateQR: (appId: string, environment: string) =>
    api.post(`/environments/${appId}/qr`, { environment }),
  updateBundle: (appId: string, environment: string, data: any) =>
    api.put(`/environments/${appId}/${environment}`, data),
};