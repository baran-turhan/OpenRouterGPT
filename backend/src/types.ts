export type ChatRole = 'system' | 'user' | 'assistant';

export interface StoredMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  model?: string;
  imageUrls?: string[];
  error?: string;
}

export interface SessionHistory {
  sessionId: string;
  messages: StoredMessage[];
  updatedAt: string;
}

export interface ChatRequestBody {
  sessionId?: string;
  model: string;
  message: string;
  imageUrls?: string[];
  temperature?: number;
}

export interface ChatResponsePayload {
  sessionId: string;
  message: StoredMessage;
}

export interface ModelSummary {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: number;
    completion: number;
  };
}
