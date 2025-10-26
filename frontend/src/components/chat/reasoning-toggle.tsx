'use client';

import { useState } from 'react';
import clsx from 'clsx';

interface ReasoningToggleProps {
  content: string;
}

const ReasoningToggle = ({ content }: ReasoningToggleProps) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 text-sm font-medium text-amber-600 transition hover:text-amber-500"
        aria-expanded={open}
      >
        {open ? 'Hide reasoning' : 'Show reasoning'}
        <span className={clsx('transition-transform duration-300', open ? 'rotate-180' : 'rotate-0')}>
          ▾
        </span>
      </button>
      <div
        className={clsx(
          'overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 text-amber-900 shadow-inner transition-all duration-300 ease-out',
          open ? 'mt-3 max-h-80 opacity-100 p-4' : 'max-h-0 opacity-0'
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">Model Thinking</p>
        <div className="mt-2 max-h-72 overflow-y-auto pr-2 text-sm leading-relaxed text-amber-900">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">
            {content.trim()}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ReasoningToggle;
