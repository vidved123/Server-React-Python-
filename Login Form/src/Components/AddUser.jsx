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
        mobile_number: "",
        role: "user",
    });
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    // 🔄 Handle input change
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 📝 Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(
                "http://127.0.0.1:5000/add_user",
                formData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`, // ✅ Add token for authentication
                    },
                    withCredentials: true, // ✅ Include cookies
                }
            );

            setMessage({ type: "success", text: response.data.message || "User added successfully!" });
            setTimeout(() => navigate("/dashboard"), 2000);
        } catch (error) {
            console.error("❌ Error adding user:", error);
            setMessage({ type: "error", text: error.response?.data?.error || "Failed to add user" });
        }
    };

    return (
        <div className="add-user-container">
            <h2>Add New User</h2>
            {message && <p className={`message ${message.type}`}>{message.text}</p>}
            <form onSubmit={handleSubmit}>
                <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Full Name" required />
                <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" required />
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
                <input type="text" name="country_code" value={formData.country_code} onChange={handleChange} placeholder="Country Code" required />
                <input type="text" name="mobile_number" value={formData.mobile_number} onChange={handleChange} placeholder="Mobile Number" required />
                <select name="role" value={formData.role} onChange={handleChange}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
                <button type="submit">Add User</button>
            </form>
            <button className="back-button" onClick={() => navigate(-1)}>Back</button>
        </div>
    );
}
