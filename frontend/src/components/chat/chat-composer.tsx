'use client';

import Image from 'next/image';
import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

interface AttachmentPreview {
  id: string;
  file: File;
  preview: string;
}

interface ChatComposerProps {
  onSend: (message: string, attachments: File[]) => Promise<void> | void;
  disabled?: boolean;
  typing: boolean;
}

const createId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const ChatComposer = ({ onSend, disabled, typing }: ChatComposerProps) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const min = 24;
    const max = 180;
    el.style.height = 'auto';
    const next = Math.max(min, Math.min(max, el.scrollHeight));
    el.style.height = `${next/2}px`;
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }, []);

  const resetAttachments = useCallback(() => {
    setAttachments((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });
  }, []);

  const dispatchMessage = useCallback(async () => {
    if (!message.trim()) {
      return;
    }
    await onSend(message, attachments.map((item) => item.file));
    setMessage('');
    resetAttachments();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [attachments, message, onSend, resetAttachments]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await dispatchMessage();
    },
    [dispatchMessage]
  );

  const handleFiles = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    const previews: AttachmentPreview[] = Array.from(files).map((file) => ({
      id: createId(),
      file,
      preview: URL.createObjectURL(file)
    }));
    setAttachments((prev) => [...prev, ...previews]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  useEffect(() => {
    return () => {
      attachments.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, [attachments]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight, message]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          {attachments.map((item) => (
            <div key={item.id} className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200">
              <Image
                src={item.preview}
                alt="Attachment preview"
                width={96}
                height={96}
                className="h-full w-full object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => removeAttachment(item.id)}
                className="absolute right-2 top-2 rounded-full bg-slate-900/80 p-1 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-3">
        <button
          type="button"
          className="flex h-14 w-14 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-700 hover:border-slate-400"
        >
          <label className="flex h-full w-full cursor-pointer items-center justify-center">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFiles}
            />
            +
          </label>
        </button>
        <div className="flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask anything..."
            className="w-full resize-none bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
            disabled={disabled}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !typing && !disabled) {
                event.preventDefault();
                void dispatchMessage();
              }
            }}
          />
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
            {typing && <span className="text-amber-500">Waiting for model...</span>}
          </div>
        </div>
        <button
          type="submit"
          disabled={disabled || typing || !message.trim()}
          className={clsx(
            'h-14 w-40 rounded-3xl bg-gradient-to-r from-indigo-500 to-sky-500 text-base font-semibold text-white transition hover:from-indigo-400 hover:to-sky-400',
            (disabled || typing || !message.trim()) && 'opacity-50'
          )}
        >
          {typing ? 'Thinking…' : 'Send'}
        </button>
      </div>
    </form>
  );
};

export default ChatComposer;
