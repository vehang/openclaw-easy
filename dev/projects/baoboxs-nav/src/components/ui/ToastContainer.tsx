'use client';

import React, { useState, useCallback } from 'react';
import Toast, { ToastType } from './Toast';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemoveToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] space-y-4 w-80 pointer-events-none">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="transform transition-all duration-300 ease-in-out pointer-events-auto"
          style={{
            zIndex: 1000 - index
          }}
        >
          <Toast
            {...toast}
            onClose={onRemoveToast}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer; 