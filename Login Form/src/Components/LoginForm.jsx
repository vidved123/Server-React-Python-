import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./LoginForm.css";

export default function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorList, setErrorList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorList([]);
        setLoading(true);

        try {
            const response = await axios.post(
                "http://127.0.0.1:8080/login",
                { username: username.trim(), password },
                { withCredentials: true }
            );

            const { token, universal_token, user_role } = response.data;

            if (!token) {
                throw new Error("Token missing in response.");
            }

            localStorage.setItem("token", token);
            localStorage.setItem("user_role", user_role);

            if (universal_token) {
                localStorage.setItem("universal_token", universal_token);
            } else {
                retrieveUniversalTokenFromCookies();
            }

            toast.success(`Welcome, ${username}!`);

            if (user_role === "admin") {
                navigate("/admin-dashboard");
            } else {
                navigate("/dashboard");
            }
        } catch (error) {
            const message = error.response?.data?.error || "Login failed.";
            setErrorList([message]);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const retrieveUniversalTokenFromCookies = () => {
        const cookies = document.cookie.split("; ");
        for (const cookie of cookies) {
            if (cookie.startsWith("universal_token=")) {
                const token = cookie.split("=")[1];
                localStorage.setItem("universal_token", token);
                return;
            }
        }
    };

    const handleUsernameChange = (e) => {
        const value = e.target.value;
        setUsername(value);

        if (value.length >= 2) {
            fetch(`/api/usernames?query=${encodeURIComponent(value)}`)
                .then((res) => res.json())
                .then((data) => setSuggestions(data))
                .catch(() => setSuggestions([]));
        } else {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setUsername(suggestion);
        setSuggestions([]);
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        const universalToken = localStorage.getItem("universal_token");

        if (!universalToken) {
            retrieveUniversalTokenFromCookies();
        }

        console.log("Token:", token);
        console.log("Universal Token:", universalToken);
    }, []);

    return (
        <div className="container">
            <h2>Login</h2>

            {errorList.length > 0 && (
                <ul id="error-list" className="message">
                    {errorList.map((err, idx) => (
                        <li key={idx}>{err}</li>
                    ))}
                </ul>
            )}

            <form onSubmit={handleLogin} id="loginForm">
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={username}
                        onChange={handleUsernameChange}
                        autoComplete="off"
                        required
                    />
                    {suggestions.length > 0 && (
                        <div id="suggestions" className="suggestions">
                            {suggestions.map((s, i) => (
                                <div
                                    key={i}
                                    className="suggestion-item"
                                    onClick={() => handleSuggestionClick(s)}
                                >
                                    {s}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>

            <Link to="/forgot-password" className="forgot-password">
                Forgot your password?
            </Link>

            <p className="switch-link">
                Don't have an account? <Link to="/register">Register</Link>
            </p>
        </div>
    );
}
