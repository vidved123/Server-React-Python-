import React from "react";

export default function PasswordInput({ password, setPassword }) {
    return (
        <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
        </div>
    );
}
