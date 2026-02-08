import React from 'react';

const variants = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: '✓',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: '✕',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: '⚠',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'ℹ',
  },
};

export function Alert({
  children,
  variant = 'info',
  title,
  className = '',
  onClose,
}) {
  const styles = variants[variant];
  
  return (
    <div
      className={`rounded-lg border p-4 ${styles.container} ${className}`}
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0 text-lg mr-3">
          {styles.icon}
        </div>
        <div className="flex-1">
          {title && (
            <h4 className="font-medium mb-1">{title}</h4>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button
            type="button"
            className="ml-3 -mr-1 -mt-1 p-1 rounded hover:bg-black/5"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default Alert;
