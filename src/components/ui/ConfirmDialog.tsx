import { useEffect } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'ลบ',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 animate-scale-in">
        <p className="text-sm font-bold text-neutral-900 text-center mb-2">{title}</p>
        <p className="text-xs text-neutral-500 text-center leading-relaxed mb-5">{message}</p>

        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 active:scale-[0.97] transition-all"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-neutral-700 hover:bg-neutral-800 active:scale-[0.97] transition-all shadow-sm"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
