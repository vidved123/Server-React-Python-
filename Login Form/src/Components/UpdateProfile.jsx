import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UpdateProfile.css";

export default function UpdateProfile() {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        full_name: "",
        sex: "",
        mobile_number: "",
        country_code: "",
        email: ""
    });
    const [message, setMessage] = useState("");
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const response = await axios.get("http://127.0.0.1:8080/api/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });
                setUser(response.data.user);
            } catch (error) {
                console.error("Profile Fetch Error:", error.response?.data || error.message);
                navigate("/login");
            }
        };

        fetchUserProfile();
    }, [navigate, token]);

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(
                "http://127.0.0.1:8080/update_profile",
                user,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                }
            );

            if (response.status === 200) {
                setMessage("✅ Profile updated successfully!");
                setTimeout(() => navigate("/profile"), 1500);
            }
        } catch (error) {
            setMessage(`❌ Error: ${error.response?.data.message || error.message}`);
        }
    };

    return (
        <div className="update-profile-container">
            <h2>Update Profile</h2>
            {message && <p className="message">{message}</p>}
            <form onSubmit={handleSubmit}>
                <label>
                    Full Name:
                    <input
                        type="text"
                        name="full_name"
                        value={user.full_name}
                        onChange={handleChange}
                        required
                    />
                </label>
                <label>
                    Sex:
                    <select name="sex" value={user.sex} onChange={handleChange} required>
                        <option value="">Select</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                    </select>
                </label>
                <label>
                    Mobile Number:
                    <input
                        type="text"
                        name="mobile_number"
                        value={user.mobile_number}
                        onChange={handleChange}
                        required
                    />
                </label>
                <label>
                    Country Code:
                    <input
                        type="text"
                        name="country_code"
                        value={user.country_code}
                        onChange={handleChange}
                        required
                    />
                </label>
                <label>
                    Email:
                    <input
                        type="email"
                        name="email"
                        value={user.email}
                        onChange={handleChange}
                        required
                    />
                </label>
                <button type="submit">Update Profile</button>
            </form>
            <button onClick={() => navigate("/profile")} className="return-button">
                🔙 Back to Profile
            </button>
        </div>
    );
}
