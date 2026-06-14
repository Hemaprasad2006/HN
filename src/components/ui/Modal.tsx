import { useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="modal-overlay fixed inset-0"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          'relative w-full animate-scale-in',
          sizeClasses[size],
          'rounded-2xl border border-white/10 dark:border-white/10 border-gray-200',
          'bg-slate-900/95 dark:bg-slate-900/95 bg-white',
          'backdrop-blur-xl shadow-2xl',
          'max-h-[90vh] overflow-y-auto'
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-white/10 dark:border-white/10 border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-100 dark:text-gray-100 text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-200"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
