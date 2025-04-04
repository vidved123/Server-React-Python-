import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
    const navigate = useNavigate();

    const [dashboardData, setDashboardData] = useState(null);
    const [userRole, setUserRole] = useState(localStorage.getItem("user_role") || "");

    useEffect(() => {
        const fetchDashboardData = async () => {
            console.log("🔍 Fetching dashboard data...");

            const token = localStorage.getItem("token");
            console.log("🔑 Stored Token:", token);

            if (!token) {
                console.error("No Token Found");
                return;
            }

            try {
                const response = await axios.get("http://127.0.0.1:5000/dashboard", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                });

                console.log("✅ API Response:", response.data);
                setDashboardData(response.data);

                // ✅ Update state & localStorage if needed
                if (response.data.user_role && response.data.user_role !== userRole) {
                    setUserRole(response.data.user_role);
                    localStorage.setItem("user_role", response.data.user_role);
                }
            } catch (error) {
                console.error("❌ Error fetching dashboard data:", error);
            }
        };

        fetchDashboardData();
    }, []); // ✅ Runs only once on component mount

    console.log("📌 Rendered Role:", userRole);

    if (!dashboardData) return <h2>Loading Dashboard...</h2>;

    return (
        <div className="dashboard-container">
            <h2>Welcome, {localStorage.getItem("username")} 🎉</h2>
            <p>Total Books: <strong>{dashboardData.total_books}</strong></p>
            <p>Total Borrowed Books: <strong>{dashboardData.total_borrowed_books}</strong></p>

            <h3>Borrowed Books</h3>
            {dashboardData.borrowed_books.length > 0 ? (
                <ul>
                    {dashboardData.borrowed_books.map((book, index) => (
                        <li key={index}>
                            {book.title} by {book.author} (Borrowed on {book.borrowed_date})
                        </li>
                    ))}
                </ul>
            ) : (
                <p>You Haven't Borrowed Any Books Yet.</p>
            )}

            <div className="dashboard-buttons">
                {userRole === "admin" && (
                    <>
                        <button onClick={() => navigate("/add_user")} className="admin-button">
                            Add User
                        </button>
                        <button onClick={() => navigate("/delete_user")} className="admin-button">
                            Delete User
                        </button>
                        <button onClick={() => navigate("/view_users")} className="admin-button">
                            View Users
                        </button>
                    </>
                )}

                <button onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("username");
                    localStorage.removeItem("user_role");
                    navigate("/");
                }} className="logout-button">Logout</button>

                <button onClick={() => navigate("/profile")} className="profile-button">Profile</button>
                <button onClick={() => navigate("/library")} className="library-home-button">Library Home</button>
            </div>
        </div>
    );
}
