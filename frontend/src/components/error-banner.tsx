'use client';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

const ErrorBanner = ({ message, onDismiss }: ErrorBannerProps) => {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-xs uppercase tracking-wide text-rose-200" type="button">
          Dismiss
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
