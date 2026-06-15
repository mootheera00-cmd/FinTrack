import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[92dvh] flex flex-col animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-neutral-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 shrink-0">
          <h2 className="text-base font-bold text-neutral-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto overscroll-contain pb-safe">
          {children}
        </div>
      </div>
    </div>
  );
}
