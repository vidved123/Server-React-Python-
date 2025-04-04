import axios from "axios";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import InputField from "./InputField.jsx";
import PasswordInput from "./PasswordInput.jsx";
import "./RegisterForm.css";
import UsernameInput from "./UsernameInput.jsx";

export default function RegisterForm() {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        full_name: "",
        sex: "",
        mobile_number: "",
        country_code: "",
        password: "",
        confirmPassword: "",
        role: "",
    });

    const COUNTRY_MAPPING = {
        "India": "IN", "IND": "IN", "+91": "IN",
        "United States": "US", "USA": "US",
        "United Kingdom": "UK", "GB": "UK", "+44": "UK",
        "Canada": "CA",
        "Australia": "AU", "+61": "AU"
    };

    const COUNTRY_CODE_MAPPING = { "+1": ["US", "CA"] };

    const VALID_COUNTRY_CODES = new Set(["IN", "US", "UK", "CA", "AU"]);

    // Normalize country code input
    const normalizeCountryCode = (code) => {
        if (COUNTRY_MAPPING[code]) return COUNTRY_MAPPING[code];
        if (COUNTRY_CODE_MAPPING[code]) return COUNTRY_CODE_MAPPING[code][0]; // Default to first country
        return code;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value.trim() });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        let normalizedCountryCode = normalizeCountryCode(formData.country_code);

        if (!VALID_COUNTRY_CODES.has(normalizedCountryCode)) {
            toast.error(`Invalid country code: ${formData.country_code}`);
            return;
        }

        const submissionData = {
            username: formData.username,
            email: formData.email,
            full_name: formData.full_name,
            sex: formData.sex,
            mobile_number: formData.mobile_number,
            country_code: normalizedCountryCode,
            password: formData.password,
            confirm_password: formData.confirmPassword,
            role: formData.role || "user",
        };

        console.log("📌 Sending Data:", submissionData);

        try {
            const response = await axios.post("http://127.0.0.1:5000/register", submissionData, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            });

            console.log("✅ Registration Response:", response.data);
            toast.success("Registration successful! Please log in.");

            setTimeout(() => (window.location.href = "/"), 1500);
        } catch (error) {
            console.error("❌ Registration Error:", error);
            toast.error(error.response?.data?.error || "Registration failed.");
        }
    };

    return (
        <div className="form-container">
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <UsernameInput
                    username={formData.username}
                    setUsername={(val) => setFormData({ ...formData, username: val })}
                />

                <InputField
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                />

                <InputField
                    label="Full Name"
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                />

                <InputField
                    label="Sex"
                    type="text"
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    placeholder="Enter your gender"
                />

                <InputField
                    label="Mobile Number"
                    type="text"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleChange}
                    placeholder="Enter your mobile number"
                />

                <InputField
                    label="Country Code"
                    type="text"
                    name="country_code"
                    value={formData.country_code}
                    onChange={handleChange}
                    placeholder="Enter your country code"
                />

                <div className="input-group">
                    <label htmlFor="role">Role</label>
                    <select
                        name="role"
                        id="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a role</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <PasswordInput
                    password={formData.password}
                    setPassword={(val) => setFormData({ ...formData, password: val })}
                />

                <PasswordInput
                    password={formData.confirmPassword}
                    setPassword={(val) => setFormData({ ...formData, confirmPassword: val })}
                />

                <button type="submit" className="register-button">
                    Register
                </button>
            </form>

            <p className="switch-link">
                Already have an account? <Link to="/">Login</Link>
            </p>
        </div>
    );
}
