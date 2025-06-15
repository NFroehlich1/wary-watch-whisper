import React, { useState, useEffect } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'default';
  duration?: number;
}

let globalToasts: Toast[] = [];
let globalSetToasts: React.Dispatch<React.SetStateAction<Toast[]>> | null = null;

const addGlobalToast = (message: string, type: Toast['type'] = 'default', duration = 4000) => {
  const id = Math.random().toString(36).substr(2, 9);
  const newToast: Toast = { id, message, type, duration };
  
  console.log("📱 Global toast added:", newToast);
  globalToasts = [...globalToasts, newToast];
  
  if (globalSetToasts) {
    globalSetToasts(globalToasts);
  }

  if (duration > 0) {
    setTimeout(() => removeGlobalToast(id), duration);
  }
};

const removeGlobalToast = (id: string) => {
  globalToasts = globalToasts.filter(toast => toast.id !== id);
  if (globalSetToasts) {
    globalSetToasts([...globalToasts]);
  }
};

export const FallbackToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    globalSetToasts = setToasts;
    
    const handleFallbackToast = (event: CustomEvent) => {
      const { message, type } = event.detail;
      addGlobalToast(message, type);
    };

    window.addEventListener('fallback-toast', handleFallbackToast as EventListener);
    
    return () => {
      window.removeEventListener('fallback-toast', handleFallbackToast as EventListener);
      globalSetToasts = null;
    };
  }, []);

  const getToastStyles = (type: Toast['type']) => {
    const baseStyles = {
      padding: '16px',
      marginBottom: '8px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500' as const,
      fontSize: '14px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: '2px solid transparent'
    };

    switch (type) {
      case 'success':
        return { ...baseStyles, backgroundColor: '#10b981', borderColor: '#059669' };
      case 'error':
        return { ...baseStyles, backgroundColor: '#ef4444', borderColor: '#dc2626' };
      case 'info':
        return { ...baseStyles, backgroundColor: '#3b82f6', borderColor: '#2563eb' };
      case 'warning':
        return { ...baseStyles, backgroundColor: '#f59e0b', borderColor: '#d97706' };
      default:
        return { ...baseStyles, backgroundColor: '#6b7280', borderColor: '#4b5563' };
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 99999,
        maxWidth: '400px',
        minWidth: '300px'
      }}
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={getToastStyles(toast.type)}
          onClick={() => removeGlobalToast(toast.id)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{toast.message}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeGlobalToast(toast.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                marginLeft: '10px'
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Global fallback toast function
export const fallbackToast = {
  success: (message: string) => {
    window.dispatchEvent(new CustomEvent('fallback-toast', { 
      detail: { message, type: 'success' } 
    }));
  },
  error: (message: string) => {
    window.dispatchEvent(new CustomEvent('fallback-toast', { 
      detail: { message, type: 'error' } 
    }));
  },
  info: (message: string) => {
    window.dispatchEvent(new CustomEvent('fallback-toast', { 
      detail: { message, type: 'info' } 
    }));
  },
  warning: (message: string) => {
    window.dispatchEvent(new CustomEvent('fallback-toast', { 
      detail: { message, type: 'warning' } 
    }));
  },
  default: (message: string) => {
    window.dispatchEvent(new CustomEvent('fallback-toast', { 
      detail: { message, type: 'default' } 
    }));
  }
}; 