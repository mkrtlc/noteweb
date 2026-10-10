import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, width = 'max-w-lg', footer }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center bg-slate-950/40 backdrop-blur-[2px] p-4 pt-[10vh] sm:pt-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${width} bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 max-h-[80vh] flex flex-col overflow-hidden`}
        onMouseDown={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

export const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1.5 text-[11px] font-medium font-sans text-slate-500 bg-slate-100 border border-slate-200 rounded">
    {children}
  </kbd>
);

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'secondary' }
> = ({ variant = 'secondary', className = '', ...props }) => {
  const styles = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-on-accent shadow-sm',
    danger: 'bg-red-600 hover:bg-red-700 text-[#fff] shadow-sm',
    ghost: 'text-slate-600 hover:bg-slate-100',
    secondary: 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50',
  }[variant];
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`}
    />
  );
};

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
export const modKey = isMac ? '⌘' : 'Ctrl';

export default Modal;
