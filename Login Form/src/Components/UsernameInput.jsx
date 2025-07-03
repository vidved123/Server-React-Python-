import React from "react";

export default function UsernameInput({ username, setUsername }) {
    return (
        <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
                id="username"
                type="text"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
        </div>
    );
}