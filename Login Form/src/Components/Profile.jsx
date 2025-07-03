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

        (async () => {
            try {
                const response = await axios.get("http://127.0.0.1:8080/api/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });
                setUser(response.data.user);
            } catch (error) {
                console.error("❌ Profile Fetch Error:", error.response?.data || error.message);
                navigate("/login");
            }
        })();
    }, [navigate, token]);

    const handleProfileUpdate = () => {
        navigate("/update_profile");
    };

    const handleProfileDelete = async () => {
        try {
            await axios.delete("http://127.0.0.1:8080/api/delete_profile", {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            localStorage.removeItem("token");
            navigate("/login");
        } catch (error) {
            console.error("❌ Error deleting profile:", error.response?.data || error.message);
        }
    };

    return (
        <div className="profile-container">
            <h2>User Profile</h2>
            {user ? (
                <div className="profile-details">
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Full Name:</strong> {user.full_name}</p>
                    <p><strong>Gender:</strong> {user.sex === "MALE" ? "Male" : "Female"}</p>
                    <p><strong>Mobile Number:</strong> {user.mobile_number}</p>
                    <p><strong>Country Code:</strong> {user.country_code}</p>
                    <p><strong>Joined:</strong> {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</p>
                </div>
            ) : (
                <p>Loading user data...</p>
            )}

            <button onClick={() => navigate("/dashboard")} className="return-button">
                🔙 Back To Dashboard
            </button>
            <button onClick={handleProfileUpdate}>
                Edit Profile
            </button>
            <button onClick={handleProfileDelete} className="confirmation-button">
                Delete Profile
            </button>
        </div>
    );
}
