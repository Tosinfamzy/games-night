import React from "react";

interface SelectOption<T> {
  label: string;
  value: T;
}

interface SelectProps<T> {
  label: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  required?: boolean;
}

export function Select<T>({
  label,
  name,
  value,
  onChange,
  options,
  required,
}: SelectProps<T>) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = options.find(
      (option) => option.value === e.target.value
    );
    if (selectedOption) {
      onChange(selectedOption.value);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-gray-900">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value as string}
        onChange={handleChange}
        required={required}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-gray-900 px-3 py-2"
      >
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
