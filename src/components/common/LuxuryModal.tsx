'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export type ModalType = 'info' | 'success' | 'warning' | 'error';

export interface ModalOptions {
  title?: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isConfirm?: boolean;
}

interface ModalContextType {
  showAlert: (message: string, title?: string, type?: ModalType) => Promise<void>;
  showConfirm: (message: string, title?: string, type?: ModalType) => Promise<boolean>;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function LuxuryModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ModalOptions | null;
    resolve?: (value: any) => void;
  }>({
    isOpen: false,
    options: null,
  });

  const showAlert = useCallback(
    (message: string, title?: string, type: ModalType = 'info'): Promise<void> => {
      return new Promise((resolve) => {
        setModalState({
          isOpen: true,
          options: {
            title: title || (type === 'error' ? 'Error' : type === 'success' ? 'Success' : type === 'warning' ? 'Notice' : 'Information'),
            message,
            type,
            confirmText: 'Understood',
            isConfirm: false,
          },
          resolve: () => resolve(),
        });
      });
    },
    [],
  );

  const showConfirm = useCallback(
    (message: string, title?: string, type: ModalType = 'warning'): Promise<boolean> => {
      return new Promise((resolve) => {
        setModalState({
          isOpen: true,
          options: {
            title: title || 'Confirmation Required',
            message,
            type,
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            isConfirm: true,
          },
          resolve: (val: boolean) => resolve(val),
        });
      });
    },
    [],
  );

  const closeModal = useCallback(() => {
    if (modalState.resolve) {
      modalState.resolve(false);
    }
    setModalState({ isOpen: false, options: null });
  }, [modalState]);

  const handleConfirm = useCallback(() => {
    if (modalState.options?.onConfirm) {
      modalState.options.onConfirm();
    }
    if (modalState.resolve) {
      modalState.resolve(true);
    }
    setModalState({ isOpen: false, options: null });
  }, [modalState]);

  const handleCancel = useCallback(() => {
    if (modalState.options?.onCancel) {
      modalState.options.onCancel();
    }
    if (modalState.resolve) {
      modalState.resolve(false);
    }
    setModalState({ isOpen: false, options: null });
  }, [modalState]);

  // Global override for native window.alert so that ANY legacy alert becomes a luxury modal
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalAlert = window.alert;
      window.alert = (message?: any) => {
        showAlert(String(message ?? ''), 'Notice', 'info');
      };

      return () => {
        window.alert = originalAlert;
      };
    }
  }, [showAlert]);

  const type = modalState.options?.type || 'info';

  const iconMap = {
    info: <Info className="w-6 h-6 text-sky-400" />,
    success: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-400" />,
    error: <AlertCircle className="w-6 h-6 text-rose-400" />,
  };

  const bgBorderMap = {
    info: 'border-sky-500/30 bg-sky-950/20 text-sky-400',
    success: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400',
    warning: 'border-amber-500/30 bg-amber-950/20 text-amber-400',
    error: 'border-rose-500/30 bg-rose-950/20 text-rose-400',
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, closeModal }}>
      {children}

      {modalState.isOpen && modalState.options && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="relative w-full max-w-md bg-stone-900 border border-[#d4af37]/40 rounded-2xl shadow-2xl p-6 text-stone-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Gold ambient glow accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#d4af37]/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl border shrink-0 ${bgBorderMap[type]}`}>
                {iconMap[type]}
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <h3 className="font-serif text-lg font-bold text-stone-100 tracking-wide">
                  {modalState.options.title}
                </h3>
                <p className="mt-2 text-sm text-stone-300 leading-relaxed break-words whitespace-pre-wrap">
                  {modalState.options.message}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="text-stone-400 hover:text-stone-100 transition p-1 rounded-lg hover:bg-stone-800 shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
              {modalState.options.isConfirm && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-300 bg-stone-800 hover:bg-stone-700 hover:text-stone-100 transition cursor-pointer"
                >
                  {modalState.options.cancelText || 'Cancel'}
                </button>
              )}

              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 rounded-xl text-xs font-bold text-stone-950 bg-gradient-to-r from-[#d4af37] via-[#f7e08b] to-[#d4af37] hover:brightness-110 transition shadow-lg shadow-[#d4af37]/20 cursor-pointer"
              >
                {modalState.options.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a LuxuryModalProvider');
  }
  return context;
}
