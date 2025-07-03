import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
    const [authenticated, setAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        setAuthenticated(!!token);
    }, []);

    const logout = () => {
        localStorage.removeItem("token");
        fetch("http://127.0.0.1:8080/logout", {
            method: "GET",
            credentials: "include",
        }).then(() => {
            setAuthenticated(false);
            navigate("/");
        });
    };

    return (
        <div className="home-page-container">
            <h1>Welcome to the Library Home Page</h1>
            <p className="welcome-text">Explore a world of knowledge at your fingertips!</p>

            <nav className="nav-buttons">
                {authenticated && (
                    <>
                        <Link to="/profile">Profile</Link>
                        <button onClick={logout} className="logout-link">Logout</button>
                    </>
                )}
            </nav>

            <div className="container">
                <p>Please choose an option to get started:</p>
                {!authenticated ? (
                    <div className="button-group">
                        <Link to="/register" className="button register-btn">Register</Link>
                        <Link to="/login" className="button login-btn">Login</Link>
                    </div>
                ) : (
                    <div className="button-group">
                        <Link to="/dashboard" className="button dashboard-btn">Go to Dashboard</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
