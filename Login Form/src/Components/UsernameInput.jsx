import React from "react";

export default function UsernameInput({ username, setUsername }) {
    return (
        <div className="input-group">
            <input
                type="text"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=" "
                required
            />
            <label>
                Username
            </label>
        </div>
    );
}
