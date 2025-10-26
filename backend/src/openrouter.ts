import axios, { AxiosInstance } from 'axios';
import { config } from './config';
import { StoredMessage } from './types';

interface OpenRouterMessagePart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | OpenRouterMessagePart[];
}

const httpClient: AxiosInstance = axios.create({
  baseURL: config.openRouter.baseUrl,
  timeout: 60_000
});

const defaultHeaders = {
  Authorization: `Bearer ${config.openRouter.apiKey}`,
  'HTTP-Referer': process.env.OPENROUTER_SITE_URL ?? 'http://localhost:3000',
  'X-Title': process.env.OPENROUTER_APP_NAME ?? 'Madlen Chat',
  'Content-Type': 'application/json'
};

export const mapHistoryToOpenRouter = (messages: StoredMessage[]): OpenRouterMessage[] => {
  return messages.map((message) => {
    if (message.imageUrls?.length) {
      const parts: OpenRouterMessagePart[] = [
        { type: 'text', text: message.content }
      ];
      message.imageUrls.forEach((url) => {
        parts.push({ type: 'image_url', image_url: { url } });
      });
      return { role: message.role, content: parts };
    }
    return { role: message.role, content: message.content };
  });
};

export async function requestChatCompletion(options: {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
}): Promise<any> {
  if (!config.openRouter.apiKey) {
    throw new Error('Missing OPENROUTER_API_KEY. Set it in your environment.');
  }
  const response = await httpClient.post(
    '/chat/completions',
    {
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.2
    },
    { headers: defaultHeaders }
  );
  return response.data;
}

export async function fetchAvailableModels(): Promise<any[]> {
  if (!config.openRouter.apiKey) {
    throw new Error('Missing OPENROUTER_API_KEY');
  }
  const response = await httpClient.get('/models', {
    headers: defaultHeaders
  });
  return response.data?.data ?? [];
}
