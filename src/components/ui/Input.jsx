import React from 'react';

export function Input({
  label,
  error,
  className = '',
  id,
  ...props
}) {
  const inputId = id || props.name;
  
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`input ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  error,
  className = '',
  id,
  rows = 3,
  ...props
}) {
  const inputId = id || props.name;
  
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={`input ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export function Select({
  label,
  error,
  className = '',
  id,
  options = [],
  placeholder = 'Select an option',
  ...props
}) {
  const inputId = id || props.name;
  
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={inputId}
        className={`input ${error ? 'input-error' : ''}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export function Checkbox({
  label,
  className = '',
  id,
  ...props
}) {
  const inputId = id || props.name;
  
  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        id={inputId}
        className="h-4 w-4 rounded border-gray-300 text-helix-primary 
                   focus:ring-helix-primary cursor-pointer"
        {...props}
      />
      {label && (
        <label htmlFor={inputId} className="ml-2 text-sm text-gray-700 cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
}

export default Input;
