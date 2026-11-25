import { ArrowUpRight, X } from 'lucide-react';
import type { ToastNotification } from '../types/barbershop';

interface ToastBannerProps {
  toast: ToastNotification | null;
  onDismiss: () => void;
  onOpenClientHistory?: (clientId: string) => void;
}

export function ToastBanner({
  toast,
  onDismiss,
  onOpenClientHistory,
}: ToastBannerProps) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 w-[min(420px,calc(100vw-2.5rem))] bg-zinc-950 text-white rounded-lg shadow-lg border border-zinc-800 px-4 py-3.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{toast.title}</p>
          <p className="mt-0.5 text-xs text-zinc-300 leading-relaxed">
            {toast.description}
          </p>

          {toast.actionLabel && toast.actionClientId && onOpenClientHistory && (
            <button
              type="button"
              onClick={() => {
                onOpenClientHistory(toast.actionClientId!);
                onDismiss();
              }}
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-white underline underline-offset-4 hover:text-zinc-200 transition-colors whitespace-nowrap"
            >
              <span>{toast.actionLabel}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar aviso"
          className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
