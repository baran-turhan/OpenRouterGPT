'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchHistory, fetchModels, fetchSessions, sendChat, uploadImage } from '@/lib/api';
import { ChatMessage, ModelOption, SessionHistory } from '@/types/chat';

const SESSION_KEY = 'madlen.session';
const MODEL_KEY = 'madlen.model';
const HISTORY_KEY = 'madlen.history';

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

export const useChat = () => {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [modelsLoading, setModelsLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const pendingAbort = useRef<AbortController | null>(null);

  const ensureSessionId = useCallback(() => {
    if (sessionId) {
      return sessionId;
    }
    const freshId = createId();
    setSessionId(freshId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, freshId);
    }
    return freshId;
  }, [sessionId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storedSession = localStorage.getItem(SESSION_KEY);
    const storedModel = localStorage.getItem(MODEL_KEY);
    const storedMessages = localStorage.getItem(HISTORY_KEY);

    if (storedSession) {
      setSessionId(storedSession);
    } else {
      const freshId = createId();
      setSessionId(freshId);
      localStorage.setItem(SESSION_KEY, freshId);
    }
    if (storedModel) {
      setSelectedModel(storedModel);
    }
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages) as ChatMessage[];
        setMessages(parsed);
      } catch (err) {
        console.warn('Unable to parse cached history', err);
      }
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const data = await fetchSessions();
      setSessions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load sessions';
      setError(message);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const refreshModels = useCallback(async () => {
    setModelsLoading(true);
    try {
      const nextModels = await fetchModels();
      setModels(nextModels);
      setSelectedModel((prev) => {
        if (prev) {
          return prev;
        }
        const fallback = nextModels[0]?.id ?? '';
        if (fallback && typeof window !== 'undefined') {
          localStorage.setItem(MODEL_KEY, fallback);
        }
        return fallback;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load models';
      setError(message);
    } finally {
      setModelsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshModels();
  }, [refreshModels]);

  const hydrateHistory = useCallback(async (id: string) => {
    if (!id) return;
    setHistoryLoading(true);
    try {
      const history = await fetchHistory(id);
      setMessages(history.messages ?? []);
      setLastUpdated(history.updatedAt ?? new Date().toISOString());
      if (typeof window !== 'undefined') {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history.messages ?? []));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load history';
      setError(message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    void hydrateHistory(sessionId);
  }, [sessionId, hydrateHistory]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!messages.length) {
      localStorage.removeItem(HISTORY_KEY);
      return;
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-200)));
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string, attachments: File[] = []) => {
      const trimmed = text.trim();
      if (!trimmed) {
        setError('Enter a message before sending.');
        return;
      }
      if (!selectedModel) {
        setError('Pick a model before sending a message.');
        return;
      }
      const activeSession = ensureSessionId();
      setTyping(true);
      setError(null);

      const optimisticMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
        model: selectedModel,
      };

      let uploadedUrls: string[] | undefined;
      if (attachments.length) {
        try {
          const uploads = await Promise.all(attachments.map(async (file) => uploadImage(file)));
          uploadedUrls = uploads.map((item) => item.url);
          optimisticMessage.imageUrls = uploadedUrls;
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Image upload failed');
          setTyping(false);
          return;
        }
      }

      setMessages((prev) => [...prev, optimisticMessage]);

      if (pendingAbort.current) {
        pendingAbort.current.abort();
      }
      const controller = new AbortController();
      pendingAbort.current = controller;

      try {
        const response = await sendChat({
          sessionId: activeSession,
          model: selectedModel,
          message: trimmed,
          imageUrls: uploadedUrls,
          temperature: 0.2,
        }, controller.signal);
        setSessionId(response.sessionId);
        if (typeof window !== 'undefined') {
          localStorage.setItem(SESSION_KEY, response.sessionId);
        }
        setMessages((prev) => [...prev, response.message]);
        setLastUpdated(response.message.createdAt);
        await loadSessions();
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setError(null);
        } else {
          const message = err instanceof Error ? err.message : 'Unable to send message';
          setMessages((prev) =>
            prev.map((msg) => (msg.id === optimisticMessage.id ? { ...msg, error: message } : msg))
          );
          setError(message);
        }
      } finally {
        pendingAbort.current = null;
        setTyping(false);
      }
    },
    [ensureSessionId, loadSessions, selectedModel]
  );

  const changeModel = useCallback((modelId: string) => {
    setSelectedModel(modelId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(MODEL_KEY, modelId);
    }
  }, []);

  const startFreshSession = useCallback(() => {
    const freshId = createId();
    setSessionId(freshId);
    setMessages([]);
    setLastUpdated(null);
    setError(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, freshId);
      localStorage.removeItem(HISTORY_KEY);
    }
  }, []);

  const selectSession = useCallback(
    (id: string) => {
      if (!id) return;
      setSessionId(id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, id);
      }
      void hydrateHistory(id);
    },
    [hydrateHistory]
  );

  const lastActivity = useMemo(() => {
    if (!lastUpdated) return null;
    return new Date(lastUpdated);
  }, [lastUpdated]);

  const cancelPendingResponse = useCallback(() => {
    if (pendingAbort.current) {
      pendingAbort.current.abort();
      pendingAbort.current = null;
      setTyping(false);
    }
  }, []);

  return {
    sessionId,
    messages,
    sessions,
    sessionsLoading,
    models,
    selectedModel,
    typing,
    error,
    modelsLoading,
    historyLoading,
    sendMessage,
    changeModel,
    refreshModels,
    startFreshSession,
    selectSession,
    lastActivity,
    setError,
    cancelPendingResponse
  };
};
