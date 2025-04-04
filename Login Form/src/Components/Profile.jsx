import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const response = await axios.get("http://127.0.0.1:5000/api/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });

                console.log("✅ Profile Data:", response.data); // Debugging Log
                setUser(response.data.user);
            } catch (error) {
                console.error("❌ Profile Fetch Error:", error.response?.data || error.message);
                navigate("/login");
            }
        };

        fetchUserProfile();
    }, [navigate, token]);

    return (
        <div className="profile-container">
            <h2>User Profile</h2>
            {user ? (
                <div className="profile-details">
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Joined:</strong> {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</p>
                </div>
            ) : (
                <p>Loading user data...</p>
            )}
            <button onClick={() => navigate("/dashboard")} className="return-button">
                🔙 Back To Dashboard
            </button>
            <button onClick={() => navigate("/update_profile")}>
                Edit Profile
            </button>
            <button onClick={() => navigate("/delete_profile")}>
                Delete Profile
            </button>

        </div>
    );
}
