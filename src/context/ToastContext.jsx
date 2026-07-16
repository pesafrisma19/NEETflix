import React, { createContext, useState, useContext, useCallback } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faExclamationCircle, faTimes } from "@fortawesome/free-solid-svg-icons";

const ToastContext = createContext({
  addToast: () => {}
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Hilangkan toast setelah 4 detik otomatis
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border transition-all animate-in slide-in-from-right fade-in duration-300 ${
              toast.type === 'error' ? 'bg-[#2D2B44] border-red-500 text-white' : 'bg-[#2D2B44] border-[#ffbade] text-white'
            }`}
          >
            <FontAwesomeIcon 
              icon={toast.type === 'error' ? faExclamationCircle : faCheckCircle} 
              className={`text-xl ${toast.type === 'error' ? 'text-red-500' : 'text-[#ffbade]'}`} 
            />
            <p className="text-sm font-bold tracking-wide">{toast.message}</p>
            <button 
              onClick={() => removeToast(toast.id)} 
              className="ml-2 text-gray-400 hover:text-white transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
