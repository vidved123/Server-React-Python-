import React from 'react';

export default function SuggestionsList({ suggestions, setUsername }) {
    if (suggestions.length === 0) return null;

    return (
        <ul className="border mt-1 rounded-md bg-white shadow-md">
            {suggestions.map((user, index) => (
                <li
                    key={index}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => setUsername(user)}
                >
                    {user}
                </li>
            ))}
        </ul>
    );
}
