// components/TextInput.tsx
"use client";

import React from "react";

interface TextInputProps {
  label: string;           // title/label text
  required?: boolean;      // show asterisk if required
  placeholder?: string;    // input placeholder
  value: string;           // current input value
  onChange: (val: string) => void; // change handler
  type?: string;           // input type, default to text
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  required = false,
  placeholder = "",
  value,
  onChange,
  type = "text",
}) => {
  return (
    <div className="flex flex-col w-full">
      <label className="text-sm font-medium mb-1 text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-b border-gray-400 focus:border-white outline-none px-2 py-1 text-gray-100 placeholder-gray-400 transition-colors duration-200"
      />
    </div>
  );
};

export default TextInput;
