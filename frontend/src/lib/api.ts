import { ChatResponse, ModelOption, SessionHistory } from '@/types/chat';

const handleResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      typeof payload === 'object' && payload !== null && 'error' in payload
        ? String((payload as Record<string, unknown>).error)
        : 'Unexpected API error';
    throw new Error(errorMessage);
  }

  return payload as T;
};

export const fetchModels = async (): Promise<ModelOption[]> => {
  const response = await fetch('/api/models', { cache: 'no-store' });
  return await handleResponse<ModelOption[]>(response);
};

export const fetchHistory = async (sessionId: string): Promise<SessionHistory> => {
  const response = await fetch(`/api/history?sessionId=${encodeURIComponent(sessionId)}`, { cache: 'no-store' });
  return await handleResponse<SessionHistory>(response);
};

export const fetchSessions = async (): Promise<SessionHistory[]> => {
  const response = await fetch('/api/sessions', { cache: 'no-store' });
  return await handleResponse<SessionHistory[]>(response);
};

interface SendChatPayload {
  sessionId?: string;
  model: string;
  message: string;
  imageUrls?: string[];
  temperature?: number;
}

export const sendChat = async (payload: SendChatPayload, signal?: AbortSignal): Promise<ChatResponse> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal
  });
  return await handleResponse<ChatResponse>(response);
};

export const uploadImage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  return await handleResponse<{ url: string }>(response);
};
