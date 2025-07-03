import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
    const navigate = useNavigate();

    const [dashboardData, setDashboardData] = useState(null);
    const [userRole, setUserRole] = useState(localStorage.getItem("user_role") || "");
    const username = localStorage.getItem("username");

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No Token Found");
                return;
            }

            try {
                const response = await axios.get("http://127.0.0.1:8080/dashboard", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                });

                setDashboardData(response.data);

                if (response.data.user_role && response.data.user_role !== userRole) {
                    setUserRole(response.data.user_role);
                    localStorage.setItem("user_role", response.data.user_role);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };

        fetchDashboardData();
    }, []);

    if (!dashboardData) return <h2>Loading Dashboard...</h2>;

    return (
        <>
            <h1>Dashboard</h1>
            <div className="container">
                {username && <p>Welcome, <strong>{username}</strong>!</p>}

                <p>Total Books: <strong>{dashboardData.total_books}</strong></p>
                <p>Total Borrowed Books: <strong>{dashboardData.total_borrowed_books}</strong></p>

                <h2>Borrowed Books</h2>
                <ul>
                    {dashboardData.borrowed_books && dashboardData.borrowed_books.length > 0 ? (
                        dashboardData.borrowed_books.map((book, index) => (
                            <li key={index}>
                                {book.title} by {book.author} (Borrowed on {book.borrowed_date})
                            </li>
                        ))
                    ) : (
                        <li>No borrowed books found.</li>
                    )}
                </ul>

                <div className="button-group">
                    {userRole.toLowerCase() === "admin" && (
                        <>
                            <button onClick={() => navigate("/add_user")} className="add-user-btn">Add User</button>
                            <button onClick={() => navigate("/delete_user")} className="delete-user-btn">Delete User</button>
                            <button onClick={() => navigate("/view_users")} className="users-roster-btn">Users Roster</button>
                        </>
                    )}
                    <button onClick={() => navigate("/library")} className="library-btn">Library</button>
                    <button onClick={() => navigate("/profile")} className="profile-btn">Profile</button>
                    <button
                        onClick={() => {
                            localStorage.removeItem("token");
                            localStorage.removeItem("username");
                            localStorage.removeItem("user_role");
                            navigate("/");
                        }}
                        className="logout-btn"
                    >
                        Logout
                    </button>
                    <button onClick={() => navigate("/")} className="back-home-btn">Back to Home</button>
                </div>
            </div>
        </>
    );
}
