/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef } from "react";
import PropTypes from "prop-types";

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const toastIdCounter = useRef(0);

  const toast = useCallback((message, type = "info") => {
    const id = ++toastIdCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        message,
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        }
      });
    });
  }, []);

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between min-w-[280px] max-w-sm px-4 py-3 rounded-xl shadow-xl border transform transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${
              t.type === "error" 
                ? "bg-rose-950/90 border-rose-900/50 text-rose-200" 
                : t.type === "success"
                ? "bg-emerald-950/90 border-emerald-900/50 text-emerald-200"
                : "bg-slate-900/90 border-slate-800/80 text-slate-200"
            } backdrop-blur-md`}
          >
            <div className="flex items-center gap-3">
              {t.type === "error" && (
                <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {t.type === "success" && (
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {t.type === "info" && (
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="text-sm font-medium tracking-tight leading-snug break-words">
                {t.message}
              </span>
            </div>
            <button 
              onClick={() => removeToast(t.id)}
              className="ml-4 p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog Overlay */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-100 mb-2">Are you sure?</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-950/50 border-t border-slate-900">
              <button
                onClick={confirmDialog.onCancel}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition active:scale-95 cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired
};
