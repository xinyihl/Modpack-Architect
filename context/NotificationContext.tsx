
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type NotificationType = 'success' | 'info' | 'warning' | 'error';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((type: NotificationType, title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-80 pointer-events-none">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-2xl animate-in slide-in-from-right-full duration-300 ${
              n.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100' :
              n.type === 'error' ? 'bg-red-950/90 border-red-500/50 text-red-100' :
              n.type === 'warning' ? 'bg-orange-950/90 border-orange-500/50 text-orange-100' :
              'bg-blue-950/90 border-blue-500/50 text-blue-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {n.type === 'success' && <CheckCircle2 size={20} className="text-emerald-500" />}
              {n.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
              {n.type === 'warning' && <AlertTriangle size={20} className="text-orange-500" />}
              {n.type === 'info' && <Info size={20} className="text-blue-500" />}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold mb-1">{n.title}</div>
              <div className="text-xs opacity-80 leading-relaxed">{n.message}</div>
            </div>
            <button onClick={() => removeNotification(n.id)} className="shrink-0 text-white/20 hover:text-white/60 transition-colors">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
};
