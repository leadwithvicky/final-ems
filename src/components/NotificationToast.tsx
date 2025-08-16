'use client';

import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';

const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-400 to-lime-400 text-white';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-orange-500 text-white';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white';
      default:
        return 'bg-gradient-to-r from-teal-400 to-cyan-400 text-white';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`max-w-sm p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${getTypeStyles(
            notification.type
          )}`}
        >
          <div className="flex items-center">
            {getIcon(notification.type)}
            <p className="ml-3 text-sm font-medium flex-1">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
