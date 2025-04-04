import axios from "axios";
import React, { useEffect, useState } from "react";
import "./ViewBorrowedBooks.css";

export default function ViewBorrowedBooks() {
    const [borrowedBooks, setBorrowedBooks] = useState([]);
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [userIdQuery, setUserIdQuery] = useState("");

    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleDateString() : "N/A";
    };

    useEffect(() => {
        fetchBorrowedBooks();
    }, []);

    const fetchBorrowedBooks = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("Authentication token is missing. Please log in.");
                setLoading(false);
                return;
            }

            const params = {};
            if (searchQuery) params.book_title = searchQuery;
            if (role === "admin" && userIdQuery) params.user_id = userIdQuery;

            const response = await axios.get("http://localhost:5000/view_borrowed_books", {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                params,
                withCredentials: true
            });

            console.log("API Response:", response.data);

            if (response.status === 200 && response.data.borrowed_books) {
                setBorrowedBooks(response.data.borrowed_books);
                setRole(response.data.role);
            } else {
                setError("Unexpected response structure from server.");
            }
        } catch (err) {
            console.error("Error fetching borrowed books:", err);
            setError(err.response ? `Server error: ${err.response.status} - ${err.response.data.error || "Unknown error"}` : "Network error. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchBorrowedBooks();
    };

    if (loading) return <p>Loading borrowed books...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="container">
            <h2>Borrowed Books</h2>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search by book title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {role === "admin" && (
                    <input
                        type="text"
                        placeholder="Search by user ID..."
                        value={userIdQuery}
                        onChange={(e) => setUserIdQuery(e.target.value)}
                    />
                )}
                <button onClick={handleSearch}>Search</button>
            </div>

            {borrowedBooks.length === 0 ? (
                <p>No borrowed books found.</p>
            ) : (
                <table className="table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Borrowed Date</th>
                            <th>Due Date</th>
                            {role === "admin" && <th>Borrowed By</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {borrowedBooks.map((book) => (
                            <tr key={book.book_id}>
                                <td>{book.title}</td>
                                <td>{book.author}</td>
                                <td>{formatDate(book.borrowed_date)}</td>
                                <td>{formatDate(book.due_date)}</td>
                                {role === "admin" && <td>{book.username || "Unknown"}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <a href="/library" className="back-button">
                🔙 Back To The Library
            </a>
        </div>
    );
}
