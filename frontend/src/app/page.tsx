'use client';

import ChatMessageList from '@/components/chat/chat-message-list';
import ChatComposer from '@/components/chat/chat-composer';
import ModelSelect from '@/components/chat/model-select';
import ErrorBanner from '@/components/error-banner';
import SessionsSidebar from '@/components/sessions-sidebar';
import { useChat } from '@/hooks/useChat';

const formatRelative = (date: Date | null) => {
  if (!date) return 'No activity yet';
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export default function HomePage() {
  const {
    sessionId,
    sessions,
    sessionsLoading,
    messages,
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
  } = useChat();
  const sessionLabel = sessionId ? `${sessionId.slice(0, 10)}…` : 'initializing…';
  const lastActivityLabel = formatRelative(lastActivity);
  const handleCopySessionId = () => {
    if (!sessionId) return;
    navigator.clipboard?.writeText(sessionId);
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <div className="shrink-0 bg-white/90 px-4 py-1">
        <SessionsSidebar
          sessions={sessions}
          currentSessionId={sessionId}
          loading={sessionsLoading}
          onSelect={selectSession}
          onNewSession={startFreshSession}
          className="w-80"
          sessionLabel={sessionLabel}
          lastActivityLabel={lastActivityLabel}
          onCopySessionId={handleCopySessionId}
        />
      </div>
      <div className="flex flex-1 justify-center px-4 py-5 pb-1 sm:px-8">
        <div className="flex w-full max-w-5xl flex-col gap-6">
          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

          <ModelSelect
            models={models}
            value={selectedModel}
            loading={modelsLoading}
            onChange={changeModel}
            onRefresh={refreshModels}
          />

          <main className="flex h-[80vh] flex-col rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-1 flex-col gap-6 overflow-hidden">
              <ChatMessageList messages={messages} loading={historyLoading} typing={typing} />
              <ChatComposer
                onSend={sendMessage}
                disabled={!selectedModel || modelsLoading}
                typing={typing}
                onCancel={cancelPendingResponse}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
