export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  model?: string;
  imageUrls?: string[];
  error?: string;
}

export interface ModelOption {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: number;
    completion: number;
  };
}

export interface SessionHistory {
  sessionId: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface ChatResponse {
  sessionId: string;
  message: ChatMessage;
}
