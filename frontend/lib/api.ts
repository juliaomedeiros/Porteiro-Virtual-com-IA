import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Morador {
  id: string;
  name: string;
  cpf: string | null;
  phone: string;
  unit: string;
  is_active: boolean;
  condominio_id: string;
  created_at?: string;
}

export interface MoradorCreate {
  name: string;
  cpf?: string;
  phone: string;
  unit: string;
  condominio_id: string;
}

export interface Condominio {
  id: string;
  name: string;
  cnpj: string;
  address?: string;
}

export const moradoresApi = {
  list: (condominio_id?: string) => 
    api.get<Morador[]>('/moradores/', { params: { condominio_id } }),
  get: (id: string) => 
    api.get<Morador>(`/moradores/${id}`),
  create: (data: MoradorCreate) => 
    api.post<Morador>('/moradores/', data),
  update: (id: string, data: Partial<MoradorCreate>) => 
    api.patch<Morador>(`/moradores/${id}`, data),
  delete: (id: string) => 
    api.delete(`/moradores/${id}`),
};

export const condominiosApi = {
  list: () => 
    api.get<Condominio[]>('/condominios/'),
  get: (id: string) => 
    api.get<Condominio>(`/condominios/${id}`),
  create: (data: Partial<Condominio>) => 
    api.post<Condominio>('/condominios/', data),
  update: (id: string, data: Partial<Condominio>) => 
    api.patch<Condominio>(`/condominios/${id}`, data),
  delete: (id: string) => 
    api.delete(`/condominios/${id}`),
};

export interface Documento {
  id: string;
  name: string;
  file_url: string | null;
  status: 'PROCESSANDO' | 'INDEXADO' | 'ERRO';
  condominio_id: string;
  created_at: string;
}

export const documentosApi = {
  list: (condominio_id: string) => 
    api.get<Documento[]>('/documents/', { params: { condominio_id } }),
  upload: (condominio_id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<Documento>('/documents/upload', formData, {
      params: { condominio_id },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  delete: (id: string) => 
    api.delete(`/documents/${id}`),
};

export interface Interacao {
  id: string;
  user_message: string;
  ai_response: string;
  token_usage: number | null;
  latency_ms: number | null;
  is_escalated: boolean;
  morador_id: string;
  created_at: string;
}

export interface Stats {
  total_interactions: number;
  escalated_interactions: number;
  total_tokens_used: number;
  escalation_rate: number;
}

export const areasComunsApi = {
  list: (condominio_id?: string) => 
    api.get<AreaComum[]>('/areas-comuns/', { params: { condominio_id } }),
  get: (id: string) => 
    api.get<AreaComum>(`/areas-comuns/${id}`),
  create: (data: Partial<AreaComum>) => 
    api.post<AreaComum>('/areas-comuns/', data),
  update: (id: string, data: Partial<AreaComum>) => 
    api.patch<AreaComum>(`/areas-comuns/${id}`, data),
  delete: (id: string) => 
    api.delete(`/areas-comuns/${id}`),
};

export interface AreaComum {
  id: string;
  name: string;
  description: string | null;
  max_capacity: number | null;
  rules: string | null;
  condominio_id: string;
}

export const analyticsApi = {
  getStats: (condominio_id: string) => 
    api.get<Stats>('/analytics/stats', { params: { condominio_id } }),
  getLogs: (condominio_id: string, params?: { limit?: number, only_escalated?: boolean }) => 
    api.get<Interacao[]>('/analytics/logs', { params: { ...params, condominio_id } }),
};

export default api;
