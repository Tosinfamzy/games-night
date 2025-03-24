import React from "react";

interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Radio({
  label,
  error,
  helperText,
  className = "",
  ...props
}: RadioProps) {
  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          type="radio"
          className={`
            h-4 w-4 border-gray-300
            text-blue-600 focus:ring-blue-500
            disabled:bg-gray-50 disabled:text-gray-500
            ${error ? "border-red-300 focus:ring-red-500" : ""}
            ${className}
          `}
          {...props}
        />
      </div>
      {label && (
        <div className="ml-3">
          <label
            htmlFor={props.id}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
          {(error || helperText) && (
            <p
              className={`mt-1 text-sm ${
                error ? "text-red-600" : "text-gray-500"
              }`}
            >
              {error || helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
