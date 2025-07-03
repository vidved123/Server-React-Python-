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
    const [messages, setMessages] = useState([]); // Simulating flash messages

    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleDateString() : "N/A";
    };

    useEffect(() => {
        fetchBorrowedBooks();
    }, []);

    const fetchBorrowedBooks = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Authentication token is missing. Please log in.");
                return;
            }

            const params = {};
            if (searchQuery) params.book_title = searchQuery;
            if (role === "admin" && userIdQuery) params.user_id = userIdQuery;

            const response = await axios.get("http://localhost:8080/view_borrowed_books", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                params,
                withCredentials: true,
            });

            if (response.status === 200) {
                setBorrowedBooks(response.data.borrowed_books || []);
                setRole(response.data.role || "");
                setMessages(["Books fetched successfully!"]); // Example success message
            } else {
                setError("Unexpected response structure from server.");
            }
        } catch (err) {
            setError(
                err.response
                    ? `Server error: ${err.response.status} - ${err.response.data.error || "Unknown"}`
                    : "Network error. Please check your connection."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchBorrowedBooks();
        setSearchQuery(""); // Reset search query after submit
        setUserIdQuery(""); // Reset user ID query
    };

    return (
        <div className="container">
            <h1>View Borrowed Books</h1>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="search-bar">
                <input
                    type="text"
                    placeholder={role === "admin" ? "Search by User ID" : "Search by Book ID, Title, or Author"}
                    value={role === "admin" ? userIdQuery : searchQuery}
                    onChange={(e) =>
                        role === "admin" ? setUserIdQuery(e.target.value) : setSearchQuery(e.target.value)
                    }
                />
                <button type="submit">Search</button>
            </form>

            {/* Flash/Error Messages */}
            {error && (
                <div className="flash-messages error">
                    <ul>
                        <li>{error}</li>
                    </ul>
                </div>
            )}
            {messages.length > 0 && (
                <div className="flash-messages success">
                    <ul>
                        {messages.map((msg, i) => (
                            <li key={i}>{msg}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Borrowed Books Table */}
            {loading ? (
                <div className="loader"></div> // You can define a loader here
            ) : borrowedBooks.length === 0 ? (
                <p>No borrowed books found.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Book ID</th>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Borrowed Date</th>
                            <th>Due Date</th>
                            {role === "admin" && <th>Username</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {borrowedBooks.map((book) => (
                            <tr key={book.book_id}>
                                <td>{book.book_id}</td>
                                <td>{book.title}</td>
                                <td>{book.author}</td>
                                <td>{formatDate(book.borrowed_date)}</td>
                                <td>{formatDate(book.due_date)}</td>
                                {role === "admin" && <td>{book.username}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Back Button */}
            <a href="/library" className="button back-button">
                Back to Library
            </a>
        </div>
    );
}
