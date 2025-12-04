import React, { useState, useEffect } from "react";

const ToastContext = React.createContext();

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info", duration = 3000) => {
    const id = Date.now();
    const newToast = { id, message, type };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (message, duration = 3000) =>
    addToast(message, "success", duration);
  const error = (message, duration = 4000) =>
    addToast(message, "error", duration);
  const info = (message, duration = 3000) =>
    addToast(message, "info", duration);
  const warning = (message, duration = 3500) =>
    addToast(message, "warning", duration);

  return (
    <ToastContext.Provider
      value={{ addToast, removeToast, success, error, info, warning }}
    >
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

const Toast = ({ toast, onClose }) => {
  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  }[toast.type];

  const icon = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  }[toast.type];

  return (
    <div
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-80 animate-slide-in`}
    >
      <span className="font-bold">{icon}</span>
      <p className="flex-1">{toast.message}</p>
      <button
        onClick={onClose}
        className="text-white hover:opacity-75 font-bold"
      >
        ×
      </button>
    </div>
  );
};
