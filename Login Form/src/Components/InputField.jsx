import React from "react";

export default function InputField({ label, type, value, onChange, name, placeholder }) {
    return (
        <div className="input-group">
            <label htmlFor={name}>{label}</label>
            <input
                id={name}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required
            />
        </div>
    );
}
