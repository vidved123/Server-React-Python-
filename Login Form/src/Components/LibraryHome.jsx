import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LibraryHome.css";

export default function LibraryHome() {
    const [libraryData, setLibraryData] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLibraryData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("No authentication token found. Please log in.");
                    return;
                }

                const response = await axios.get("http://127.0.0.1:5000/library", {
                    headers: { Authorization: `Bearer ${token}` }, // ✅ FIXED SYNTAX
                    withCredentials: true,
                });

                console.log("✅ Library API Response:", response.data);
                setLibraryData(response.data);
                localStorage.setItem("role", response.data.role);
            } catch (err) {
                console.error("❌ Error fetching library data:", err);
                setError(err.response?.data?.message || "Failed to load library data.");
            }
        };

        fetchLibraryData();
    }, []);

    if (error) {
        return <p className="error-message">❌ {error}</p>;
    }

    if (!libraryData || !libraryData.role) {
        return <p>Loading library data...</p>;
    }

    console.log("🚀 Final Library Data:", libraryData);

    return (
        <div className="library_home-container">
            <h2>📚 Welcome To The Library Homepage, {libraryData.username}</h2>
            <p>Total Books Available: <strong>{libraryData.book_count}</strong></p>

            <h3>Your Borrowed Books</h3>
            {libraryData.borrowed_books.length > 0 ? (
                <ul>
                    {libraryData.borrowed_books.map((book) => (
                        <li key={book.book_id}>
                            <strong>{book.title}</strong> by {book.author}
                            <br />
                            Borrowed On: {book.borrowed_date} | Due: {book.due_date}
                            {book.overdue_days > 0 && (
                                <span style={{ color: "red" }}> Overdue by {book.overdue_days} days! Fine: ${book.fine}</span>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>You have no borrowed books.</p>
            )}

            <div className="button-container">
                <button className="nav-button" onClick={() => navigate("/view_books")}>
                    📖 View Books
                </button>

                {/* ✅ NEW: Borrow Books Button */}
                <button className="borrow-button" onClick={() => navigate("/borrow")}>
                    📥 Borrow Books
                </button>

                <button className="nav-button" onClick={() => navigate("/view_borrowed_books")}>
                    📚 View Borrowed Books
                </button>
                <button className="nav-button" onClick={() => navigate("/return_books")}>
                    📤 Return Books
                </button>

                {/* ✅ Fixed Admin Role Check */}
                {libraryData?.role?.toLowerCase() === "admin" && (
                    <>
                        <button className="admin-button" onClick={() => navigate("/book_master")}>
                            🛠️ Book Master
                        </button>
                        <button className="admin-button" onClick={() => navigate("/add_books")}>
                            ➕ Add Books
                        </button>
                    </>
                )}

                <button className="nav-button" onClick={() => navigate("/dashboard")}>
                    🔙 Back To The Dashboard
                </button>
            </div>
        </div>
    );
}
