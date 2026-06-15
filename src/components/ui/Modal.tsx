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
          'rounded-2xl modal-panel',
          'backdrop-blur-xl shadow-2xl',
          'max-h-[90vh] overflow-y-auto'
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between modal-panel-header px-6 py-4">
            <h2 className="text-base font-semibold modal-panel-title">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 modal-close-btn transition-colors"
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
