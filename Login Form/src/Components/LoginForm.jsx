import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./LoginForm.css";
import PasswordInput from "./PasswordInput.jsx";
import UsernameInput from "./UsernameInput.jsx";

export default function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        console.log("📩 Sending Login Request:", { username, password });

        try {
            const response = await axios.post("http://127.0.0.1:5000/login",
                { username: username.trim(), password },
                { withCredentials: true } // ✅ Send credentials (cookies)
            );

            console.log("✅ API Response:", response.data);

            const { token, universal_token, user_role } = response.data;

            if (!token) {
                throw new Error("🚨 Token missing in server response.");
            }

            // ✅ Store tokens in localStorage
            localStorage.setItem("token", token);
            localStorage.setItem("user_role", user_role);

            if (universal_token) {
                localStorage.setItem("universal_token", universal_token);
            } else {
                console.warn("⚠️ Universal Token missing, attempting to retrieve from cookies...");
                retrieveUniversalTokenFromCookies();
            }

            toast.success(`Welcome, ${username}! 🎉`);

            // ✅ Navigate to dashboard
            setTimeout(() => navigate("/dashboard"), 1500);
        } catch (error) {
            console.error("❌ Login Error:", error);

            let errorMessage = "An unexpected error occurred.";
            if (error.response && error.response.data.error) {
                errorMessage = error.response.data.error;
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Retrieve universal token from cookies if missing
    const retrieveUniversalTokenFromCookies = () => {
        const cookies = document.cookie.split("; ");
        let foundUniversalToken = null;

        cookies.forEach(cookie => {
            if (cookie.startsWith("universal_token=")) {
                foundUniversalToken = cookie.split("=")[1];
                localStorage.setItem("universal_token", foundUniversalToken);
                console.log("✅ Universal Token retrieved from cookies:", foundUniversalToken);
            }
        });

        if (!foundUniversalToken) {
            console.error("🚨 Universal Token still missing after cookie check.");
        }
    };

    // ✅ Check and restore tokens on component mount
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUniversalToken = localStorage.getItem("universal_token");

        if (!storedUniversalToken) {
            console.warn("⚠️ Universal Token not found in localStorage, checking cookies...");
            retrieveUniversalTokenFromCookies();
        }

        console.log("🔍 Stored Token:", storedToken);
        console.log("🔍 Stored Universal Token:", storedUniversalToken);
    }, []);

    return (
        <div className="container">
            <h2>Login</h2>
            {error && <p className="message">{error}</p>}

            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <UsernameInput username={username} setUsername={setUsername} />
                </div>

                <div className="form-group">
                    <PasswordInput password={password} setPassword={setPassword} />
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
