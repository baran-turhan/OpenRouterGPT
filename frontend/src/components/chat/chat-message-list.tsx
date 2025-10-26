'use client';

import Image from 'next/image';
import ReactMarkdown, { type Components } from 'react-markdown';
import { ComponentPropsWithoutRef, useEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { ChatMessage } from '@/types/chat';
import TypingIndicator from './typing-indicator';
import ReasoningToggle from './reasoning-toggle';

interface ChatMessageListProps {
  messages: ChatMessage[];
  loading: boolean;
  typing: boolean;
}

const formatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit'
});

type MarkdownCodeProps = ComponentPropsWithoutRef<'code'> & { inline?: boolean };
type MarkdownUnorderedListProps = ComponentPropsWithoutRef<'ul'>;
type MarkdownOrderedListProps = ComponentPropsWithoutRef<'ol'>;

const markdownComponents: Components = {
  code({ inline, className, children, ...props }: MarkdownCodeProps) {
    if (inline) {
      return (
        <code className="rounded bg-slate-200 px-1 py-0.5 text-xs text-slate-800" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="overflow-x-auto rounded-2xl bg-slate-900/90 p-4 text-sm text-slate-100">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    );
  },
  ul({ children, ...props }: MarkdownUnorderedListProps) {
    return (
      <ul className="list-disc space-y-1 pl-6" {...props}>
        {children}
      </ul>
    );
  },
  ol({ children, ...props }: MarkdownOrderedListProps) {
    return (
      <ol className="list-decimal space-y-1 pl-6" {...props}>
        {children}
      </ol>
    );
  }
};

const extractThinking = (raw: string) => {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith('<think>')) {
    return { visible: raw, reasoning: null as string | null };
  }
  const closingIndex = trimmed.indexOf('</think>');
  if (closingIndex === -1) {
    return { visible: raw, reasoning: null as string | null };
  }
  const reasoning = trimmed.slice(7, closingIndex).trim();
  const remainder = trimmed.slice(closingIndex + 8).replace(/^\s+/, '');
  return {
    visible: remainder || '',
    reasoning: reasoning || null
  };
};

const ChatMessageList = ({ messages, loading, typing }: ChatMessageListProps) => {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[0, 1, 2].map((key) => (
            <div key={key} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 h-4 w-1/3 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>
      );
    }

    if (!messages.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
          <p className="text-lg font-medium">You have a clean canvas.</p>
          <p className="text-sm">Pick a model, ask a question, and your conversation will appear here.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const timestamp = message.createdAt ? new Date(message.createdAt) : new Date();
          const { reasoning, visible } = !isUser ? extractThinking(message.content) : { reasoning: null, visible: message.content };
          const visibleText = visible ?? message.content;
          return (
            <div key={message.id} className={clsx('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
              <article
                className={clsx(
                  'max-w-2xl rounded-3xl border p-4 shadow-sm transition-colors',
                  isUser
                    ? 'border-indigo-100 bg-indigo-50 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-900'
                )}
              >
                <div className="mb-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
                  <span className={clsx('font-semibold', isUser ? 'text-black' : 'text-emerald-500')}>
                    {isUser ? 'You' : 'Assistant'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-400">{formatter.format(timestamp)}</span>
                  {message.model && !isUser && (
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] text-slate-500">
                      {message.model}
                    </span>
                  )}
                </div>
                {!isUser && reasoning && <ReasoningToggle content={reasoning} />}
                <div className="space-y-3 text-base text-slate-900">
                  <ReactMarkdown components={markdownComponents}>{visibleText || ''}</ReactMarkdown>
                </div>
                {message.imageUrls && message.imageUrls.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {message.imageUrls.map((url) => (
                      <Image
                        key={url}
                        src={url}
                        alt="Uploaded context"
                        width={112}
                        height={112}
                        loading="lazy"
                        unoptimized
                        className="h-28 w-28 rounded-2xl border border-slate-200 object-cover"
                      />
                    ))}
                  </div>
                )}
                {message.error && (
                  <p className="mt-3 text-sm text-rose-500">
                    Delivery failed: {message.error}
                  </p>
                )}
              </article>
            </div>
          );
        })}
      </div>
    );
  }, [loading, messages]);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto pr-1 max-h-full">
      {content}
      {typing && <TypingIndicator />}
      <div ref={endRef} />
    </div>
  );
};

export default ChatMessageList;
