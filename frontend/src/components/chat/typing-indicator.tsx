'use client';

const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-2 rounded-3xl border border-slate-700/70 bg-slate-900/70 px-5 py-3 text-slate-300">
      <span className="text-xs uppercase tracking-wide text-slate-400">Assistant</span>
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-2 w-2 animate-bounce rounded-full bg-slate-200"
            style={{ animationDelay: `${dot * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
};

export default TypingIndicator;
