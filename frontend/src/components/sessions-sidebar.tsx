'use client';

import clsx from 'clsx';
import { SessionHistory } from '@/types/chat';

interface SessionsSidebarProps {
  sessions: SessionHistory[];
  currentSessionId: string;
  loading: boolean;
  onSelect: (sessionId: string) => void;
  onNewSession: () => void;
  className?: string;
  sessionLabel: string;
  lastActivityLabel: string;
  onCopySessionId: () => void;
}

const formatTimestamp = (timestamp: string) => {
  try {
    return new Date(timestamp).toLocaleString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '';
  }
};

const SessionsSidebar = ({
  sessions,
  currentSessionId,
  loading,
  onSelect,
  onNewSession,
  className,
  sessionLabel,
  lastActivityLabel,
  onCopySessionId
}: SessionsSidebarProps) => {
  return (
    <aside
      className={clsx(
        'flex h-full w-72 flex-col gap-3 rounded-3xl bg-white/70 p-2 shadow-sm',
        className
      )}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-500 shadow-sm">
        <p className="uppercase tracking-wide">Session</p>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <code className="rounded-2xl bg-slate-900/90 px-3 py-1 text-white">
            {sessionLabel}
          </code>
          <button
            type="button"
            onClick={onCopySessionId}
            className="text-xs font-medium text-slate-600 underline-offset-4 hover:underline"
          >
            Copy
          </button>
        </div>
        <p className="mt-2 text-[11px]">
          Last activity · {lastActivityLabel}
        </p>
      </div>

      <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex-1">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Conversations
            </p>
            <p className="text-base font-semibold text-slate-800">
              {sessions.length || 0} threads
            </p>
          </div>
          <button
            type="button"
            onClick={onNewSession}
            className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((key) => (
                <div
                  key={key}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-slate-100/60 p-3"
                >
                  <div className="mb-2 h-3 w-1/2 rounded bg-slate-200" />
                  <div className="h-3 w-3/4 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : sessions.length ? (
            <ul className="space-y-2">
              {sessions.map((session) => {
                const isActive = session.sessionId === currentSessionId;
                const preview =
                  session.messages.find((m) => m.role === 'user')?.content ??
                  'No messages yet';
                return (
                  <li key={session.sessionId}>
                    <button
                      type="button"
                      onClick={() => onSelect(session.sessionId)}
                      className={clsx(
                        'w-full rounded-2xl border px-4 py-3 text-left transition',
                        isActive
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                      )}
                    >
                      <p className="line-clamp-1 text-sm font-semibold">
                        {preview}
                      </p>
                      <p
                        className={clsx(
                          'text-xs',
                          isActive ? 'text-white/80' : 'text-slate-500'
                        )}
                      >
                        {formatTimestamp(session.updatedAt)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Start a conversation to see it listed here.
            </div>
          )}
        </div>
      </div>
    </aside>

  );
};

export default SessionsSidebar;
