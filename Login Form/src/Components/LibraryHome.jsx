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

                const response = await axios.get("http://127.0.0.1:8080/library", {
                    headers: { Authorization: `Bearer ${token}` },
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

        fetchLibraryData().catch(console.error);
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
            <header>
                <h1>Welcome, {libraryData.username}</h1>
                <p>Total Books: {libraryData.book_count}</p>
            </header>

            {libraryData.role !== "ADMIN" && (
                <section>
                    <h2>Borrowed Books</h2>
                    <table>
                        <thead>
                        <tr>
                            <th>Book ID</th>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Borrowed Date</th>
                            <th>Due Date</th>
                        </tr>
                        </thead>
                        <tbody>
                        {libraryData.borrowed_books.map((book) => (
                            <tr key={book.book_id}>
                                <td>{book.book_id}</td>
                                <td>{book.title}</td>
                                <td>{book.author}</td>
                                <td>{new Date(book.borrowed_date).toLocaleDateString()}</td>
                                <td>{new Date(book.due_date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    <h2>Overdue Books</h2>
                    <table className="overdue-table">
                        <thead>
                        <tr>
                            <th>Book ID</th>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Borrowed Date</th>
                            <th>Due Date</th>
                            <th>Overdue Days</th>
                            <th>Fine</th>
                        </tr>
                        </thead>
                        <tbody>
                        {libraryData.borrowed_books.map(
                            (book) =>
                                book.overdue_days > 0 && (
                                    <tr key={book.book_id}>
                                        <td>{book.book_id}</td>
                                        <td>{book.title}</td>
                                        <td>{book.author}</td>
                                        <td>{new Date(book.borrowed_date).toLocaleDateString()}</td>
                                        <td>{new Date(book.due_date).toLocaleDateString()}</td>
                                        <td>{book.overdue_days}</td>
                                        <td>${book.fine}</td>
                                    </tr>
                                )
                        )}
                        </tbody>
                    </table>
                </section>
            )}

            <div className="button-container">
                <button className="nav-button" onClick={() => navigate("/view_books")}>
                    📖 View Books
                </button>
                <button className="borrow-button" onClick={() => navigate("/borrow")}>
                    📥 Borrow Books
                </button>
                <button
                    className="nav-button"
                    onClick={() => navigate("/view_borrowed_books")}
                >
                    📚 View Borrowed Books
                </button>
                <button className="nav-button" onClick={() => navigate("/return_books")}>
                    📤 Return Books
                </button>

                {libraryData.role.toLowerCase() === "admin" && (
                    <>
                        <button
                            className="admin-button"
                            onClick={() => navigate("/book_master")}
                        >
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
