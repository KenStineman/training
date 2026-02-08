import React from 'react';

export function Loading({ text = 'Loading...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="spinner w-8 h-8 mb-4" />
      <p className="text-gray-500">{text}</p>
    </div>
  );
}

export function LoadingOverlay({ text = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className="spinner w-12 h-12 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">{text}</p>
      </div>
    </div>
  );
}

export function LoadingDots() {
  return (
    <span className="inline-flex space-x-1">
      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </span>
  );
}

export default Loading;
