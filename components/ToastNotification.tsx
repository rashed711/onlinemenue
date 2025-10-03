
import React from 'react';
import { CheckCircleIcon } from './icons/Icons';

interface ToastNotificationProps {
  message: string;
  isVisible: boolean;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ message, isVisible }) => {
  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3 bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-800 px-6 py-3 rounded-full shadow-lg">
        <CheckCircleIcon className="w-6 h-6 text-green-400" />
        <span className="font-semibold">{message}</span>
      </div>
    </div>
  );
};
