import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
    return (
        <div className="home-page-container">
            <h2>
                Welcome To Our Platform
            </h2>
            <p>
                Please Register Or Login To Continue
            </p>
            <div className="button-group">
                <Link
                    to="/register" className="button register-btn">
                    Register
                </Link>
                <Link
                    to="/login" className="button login-btn">
                    Login
                </Link>
            </div>
        </div>
    );
}

