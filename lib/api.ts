const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

const HTTP_MESSAGES: Record<number, string> = {
  400: 'Invalid request.',
  401: 'Authentication required.',
  403: 'Access denied.',
  404: 'Resource not found.',
  422: 'Invalid data submitted.',
  429: 'Too many requests — please wait a moment.',
  500: 'Server error. Please try again.',
  502: 'Service unavailable.',
  503: 'Service temporarily unavailable.',
};

async function parseApiError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body.detail === 'string' && body.detail.length > 0) return body.detail;
    if (Array.isArray(body.detail) && body.detail.length > 0) {
      return body.detail[0].msg ?? 'Validation error';
    }
  } catch {
    // body is not JSON — fall through to HTTP status message
  }
  return HTTP_MESSAGES[response.status] ?? `Unexpected error (HTTP ${response.status})`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(buildUrl(endpoint));
    } catch {
      throw new ApiError('Unable to reach the server. Check your connection.', 0);
    }
    if (!response.ok) {
      const message = await parseApiError(response);
      throw new ApiError(message, response.status);
    }
    return response.json() as Promise<T>;
  },

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    let response: Response;
    try {
      response = await fetch(buildUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      throw new ApiError('Unable to reach the server. Check your connection.', 0);
    }
    if (!response.ok) {
      const message = await parseApiError(response);
      throw new ApiError(message, response.status);
    }
    return response.json() as Promise<T>;
  },

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    let response: Response;
    try {
      response = await fetch(buildUrl(endpoint), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      throw new ApiError('Unable to reach the server. Check your connection.', 0);
    }
    if (!response.ok) {
      const message = await parseApiError(response);
      throw new ApiError(message, response.status);
    }
    return response.json() as Promise<T>;
  },

  async delete(endpoint: string): Promise<void> {
    let response: Response;
    try {
      response = await fetch(buildUrl(endpoint), { method: 'DELETE' });
    } catch {
      throw new ApiError('Unable to reach the server. Check your connection.', 0);
    }
    if (!response.ok) {
      const message = await parseApiError(response);
      throw new ApiError(message, response.status);
    }
  },

  async postForm<T>(endpoint: string, formData: FormData): Promise<T> {
    let response: Response;
    try {
      response = await fetch(buildUrl(endpoint), { method: 'POST', body: formData });
    } catch {
      throw new ApiError('Unable to reach the server. Check your connection.', 0);
    }
    if (!response.ok) {
      const message = await parseApiError(response);
      throw new ApiError(message, response.status);
    }
    return response.json() as Promise<T>;
  },
};

import { Opportunity, Briefing, User } from './types';

export const opportunityApi = {
  list: (userId: string) =>
    apiClient.get<Opportunity[]>(`/opportunities/list?user_id=${userId}`),

  getOne: (id: string) =>
    apiClient.get<Opportunity>(`/opportunities/${id}`),

  create: (
    data: {
      title: string;
      company_name: string;
      value: number;
      priority: string;
      win_probability: number;
      contact_name?: string;
      contact_email?: string;
      contact_phone?: string;
      meeting_date?: string;
    },
    userId: string,
  ) => apiClient.post<Opportunity>(`/opportunities/create?user_id=${userId}`, data),

  update: (
    id: string,
    data: {
      title?: string;
      company_name?: string;
      value?: number;
      stage?: string;
      win_probability?: number;
      priority?: string;
      contact_name?: string;
      contact_email?: string;
      contact_phone?: string;
      meeting_date?: string;
    },
  ) => apiClient.put<Opportunity>(`/opportunities/${id}`, data),

  delete: (id: string) => apiClient.delete(`/opportunities/${id}`),

  search: (query: string, userId: string) =>
    apiClient.get<Opportunity[]>(`/opportunities/search?q=${encodeURIComponent(query)}&user_id=${userId}`),

  getBriefing: (id: string) =>
    apiClient.get<Briefing>(`/opportunities/${id}/briefing`),
};

interface CopilotChatResponse {
  message: string;
  suggestions: string[];
  requirements: Record<string, string | null | undefined>;
  tactical_advice?: string | null;
  progress: number;
  is_complete: boolean;
}

export const copilotApi = {
  chat: (messages: Array<{ role: string; content: string }>) =>
    apiClient.post<CopilotChatResponse>('/copilot/chat', { messages }),
  save: (data: { 
    opportunity_id: string; 
    messages: Array<{ role: string; content: string }>; 
    requirements: Record<string, string | null | undefined>; 
    type?: string 
  }) =>
    apiClient.post('/copilot/save', data),
  generateQuote: (requirements: Record<string, string | null | undefined>) =>
    apiClient.post('/copilot/quote', { requirements }),
};

export const interactionApi = {
  listByOpportunity: (opportunityId: string) => apiClient.get(`/interactions/opportunity/${opportunityId}`),
  getOne: (id: string) => apiClient.get(`/interactions/${id}`),
  create: (data: { opportunity_id: string; type: string; summary?: string; raw_transcript?: string; requirements?: any }) => 
    apiClient.post('/interactions/', data),
  delete: (id: string) => apiClient.delete(`/interactions/${id}`),
};

export const usersApi = {
  getOne: (userId: string) => apiClient.get<User>(`/users/${userId}`),
  list: () => apiClient.get<User[]>('/users/'),
  create: (data: { email: string; password: string; role: string }) => apiClient.post<User>('/users/', data),
  update: (id: string, data: { email?: string; role?: string; password?: string }) => apiClient.put<User>(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
};

export const documentsApi = {
  list: () => apiClient.get('/documents/'),
  upload: (file: File, category: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', category);
    return apiClient.postForm('/documents/upload', fd);
  },
  reindex: (id: string) => apiClient.post(`/documents/${id}/reindex`, {}),
  reindexAll: () => apiClient.post('/documents/reindex-all', {}),
  delete: (id: string) => apiClient.delete(`/documents/${id}`),
};

export const adminApi = {
  getStats: () => apiClient.get('/admin/stats'),
};

export const leadsApi = {
  search: (data: {
    query?: string;
    location?: string;
    activity_sector?: string;
    sources?: string[];
    max_results?: number;
  }) => apiClient.post('/leads/search', data),

  save: (data: {
    company_name?: string | null;
    contact_name?: string | null;
    contact_title?: string | null;
    activity_sector?: string | null;
    website_url?: string | null;
    linkedin_url?: string | null;
    location?: string | null;
    summary?: string | null;
    source: string;
    relevance_score: number;
    search_query?: string | null;
    search_location?: string | null;
  }) => apiClient.post('/leads/save', data),

  listSaved: (params?: { status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return apiClient.get(`/leads/saved${query ? `?${query}` : ''}`);
  },

  updateSaved: (
    id: string,
    data: {
      status?: string;
      notes?: string | null;
      company_name?: string | null;
      contact_name?: string | null;
      contact_title?: string | null;
      contact_email?: string | null;
      contact_phone?: string | null;
      activity_sector?: string | null;
      website_url?: string | null;
    },
  ) => apiClient.put(`/leads/saved/${id}`, data),

  deleteSaved: (id: string) => apiClient.delete(`/leads/saved/${id}`),

  convert: (id: string, userId: string) =>
    apiClient.post(`/leads/saved/${id}/convert?user_id=${userId}`, {}),

  exportAirtable: (data: {
    lead_ids: string[];
    api_key: string;
    base_id: string;
    table_name?: string;
  }) => apiClient.post('/leads/export/airtable', data),

  exportNotion: (data: {
    lead_ids: string[];
    token: string;
    database_id: string;
  }) => apiClient.post('/leads/export/notion', data),

  importAirtable: (data: {
    api_key: string;
    base_id: string;
    table_name?: string;
  }) => apiClient.post('/leads/import/airtable', data),

  importNotion: (data: {
    token: string;
    database_id: string;
  }) => apiClient.post('/leads/import/notion', data),
};

export const scoringApi = {
  getConfig: () => apiClient.get('/scoring/config'),
  updateConfig: (data: Partial<{
    warm_threshold: number; hot_threshold: number;
    fit_weight: number; intent_weight: number;
    click_score_boost: number; reply_score_boost: number;
    webinar_score_boost: number; meeting_score_boost: number;
    max_hot_attempts: number; cooldown_score_penalty: number;
  }>) => apiClient.put('/scoring/config', data),
  scoreLead: (leadId: string) => apiClient.post(`/scoring/score/${leadId}`, {}),
  recordEvent: (leadId: string, eventType: string, metadata?: Record<string, unknown>) =>
    apiClient.post(`/scoring/event/${leadId}`, { event_type: eventType, metadata }),
  getPipelineStats: () => apiClient.get('/scoring/pipeline/stats'),
  runCooldown: () => apiClient.post('/scoring/cooldown', {}),
  getScoreEvents: (leadId: string) => apiClient.get(`/scoring/events/${leadId}`),
};

export const agentsApi = {
  runAgent: (leadId: string) => apiClient.post(`/agents/run/${leadId}`, {}),
  getRecommendation: (leadId: string) => apiClient.get(`/agents/recommendation/${leadId}`),
  getMessages: (leadId: string) => apiClient.get(`/agents/messages/${leadId}`),
  updateMessageStatus: (messageId: string, status: string) =>
    apiClient.put(`/agents/messages/${messageId}/status?status=${status}`, {}),
};
