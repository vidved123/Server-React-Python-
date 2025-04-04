import React from "react";

export default function PasswordInput({ password, setPassword }) {
    return (
        <div className="input-group">
            <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                required
            />
            <label>
                Password
            </label>
        </div>
    );
}
