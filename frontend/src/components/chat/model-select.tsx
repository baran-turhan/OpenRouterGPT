"use client";

import clsx from 'clsx';
import { useState } from 'react';
import { ModelOption } from '@/types/chat';

interface ModelSelectProps {
  models: ModelOption[];
  value: string;
  loading: boolean;
  onChange: (modelId: string) => void;
  onRefresh: () => void;
}

const ModelSelect = ({ models, value, loading, onChange, onRefresh }: ModelSelectProps) => {
  const selected = models.find((model) => model.id === value);
  const [infoModelId, setInfoModelId] = useState<string | null>(null);
  const showInfo = selected?.id === infoModelId;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-3">
            <select
              className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              value={value}
              disabled={loading || !models.length}
              onChange={(event) => onChange(event.target.value)}
            >
              <option value="">{loading ? 'Loading models…' : 'Select a model'}</option>
              {models.map((model) => (
                <option key={model.id} value={model.id} title={model.description ?? 'OpenRouter model'}>
                  {model.name ?? model.id}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={loading}
              onClick={onRefresh}
              className={clsx(
                'rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900',
                loading && 'animate-pulse opacity-60'
              )}
            >
              Refresh
            </button>
          </div>
        </div>
        {selected && (
          <button
            type="button"
            onClick={() => setInfoModelId(showInfo ? null : selected.id)}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400"
          >
            {showInfo ? 'Hide Model Info' : 'About Model'}
          </button>
        )}
      </div>
      {selected && showInfo && (
        <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">{selected.name ?? selected.id}</p>
          {selected.description && <p className="text-sm text-slate-600">{selected.description}</p>}
          <div className="text-xs text-slate-500">
            {selected.context_length && <p>Context window: {selected.context_length.toLocaleString()} tokens</p>}
            {selected.pricing && (
              <p>
                Pricing: prompt {selected.pricing.prompt} • completion {selected.pricing.completion}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelect;
