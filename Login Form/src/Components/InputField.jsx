import React from 'react';

export default function InputField({ label, type, value, onChange, name, placeholder }) {

    return (
        <div className="mb-4">
            <label
                className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            />
        </div>
    );
}
