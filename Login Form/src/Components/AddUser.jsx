import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddUser.css";

export default function AddUser() {
    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        password: "",
        email: "",
        country_code: "",
        phone: "",
        role: "USER",
    });

    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://127.0.0.1:8080/add_user", formData, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                withCredentials: true,
            });

            setMessage({ type: "success", text: response.data.message || "User added successfully!" });
            setTimeout(() => navigate("/dashboard"), 2000);
        } catch (error) {
            setMessage({
                type: "danger",
                text: error.response?.data?.error || "Failed to add user",
            });
        }
    };

    return (
        <div className="container">
            <h1>ADD USER</h1>

            {message && <div className={`message ${message.type}`}>{message.text}</div>}

            <form onSubmit={handleSubmit} className="form-layout">
                <div className="form-column">
                    <label htmlFor="full_name">Full Name:</label>
                    <input
                        type="text"
                        name="full_name"
                        id="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        name="username"
                        id="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="email">Email ID:</label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="phone">Phone Number:</label>
                    <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-column">
                    <label htmlFor="country_code">Country Code:</label>
                    <input
                        type="text"
                        name="country_code"
                        id="country_code"
                        value={formData.country_code}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        name="password"
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="role">Role:</label>
                    <select
                        name="role"
                        id="role"
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>

                <button type="submit">Add User</button>
            </form>

            <div className="back-btn">
                <button onClick={() => navigate(-1)}>Back to Dashboard</button>
            </div>
        </div>
    );
}
