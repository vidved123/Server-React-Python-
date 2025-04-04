import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ViewBooks.css"; // Ensure this file exists

export default function ViewBooks() {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch books when the component loads or when searchQuery changes
    useEffect(() => {
        fetchBooks();
    }, [searchQuery]);

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get("http://127.0.0.1:5000/view_books", {
                params: { search: searchQuery || "" },
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });

            console.log("📚 API Response:", response.data);

            if (response.data.is_admin !== undefined) {
                setIsAdmin(response.data.is_admin);
                console.log("👮 Is Admin:", response.data.is_admin);
            } else {
                console.warn("⚠️ is_admin missing from API response!");
            }

            const sortedBooks = response.data.books.sort((a, b) => a.title.localeCompare(b.title));
            setBooks(sortedBooks);
        } catch (err) {
            console.error("❌ Error fetching books:", err);
            setError(err.response?.data?.message || "Failed to load books.");
        } finally {
            setLoading(false);
        }
    };

    // Handle checkbox selection
    const handleCheckboxChange = (bookId) => {
        setSelectedBooks((prevSelected) =>
            prevSelected.includes(bookId)
                ? prevSelected.filter((id) => id !== bookId)
                : [...prevSelected, bookId]
        );
    };

    // Handle delete books
    const handleDelete = async () => {
        if (selectedBooks.length === 0) {
            alert("Please select at least one book to delete.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                "http://127.0.0.1:5000/delete_books",
                { book_ids: selectedBooks },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                }
            );

            console.log("🗑️ Delete response:", response.data);

            // Remove deleted books from state
            setBooks((prevBooks) => prevBooks.filter((book) => !selectedBooks.includes(book.book_id)));
            setSelectedBooks([]);
            alert("Books deleted successfully!");
        } catch (err) {
            console.error("❌ Error deleting books:", err);
            alert("Failed to delete books.");
        }
    };

    return (
        <div className="view-books-container">
            <h2>📚 View Books</h2>

            {/* Search Input */}
            <input
                type="text"
                placeholder="🔍 Search by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
            />

            {/* Loading or Error Messages */}
            {loading ? (
                <h3>🔄 Loading books...</h3>
            ) : error ? (
                <div className="error-message">❌ {error}</div>
            ) : (
                <div className="book-list">
                    {/* Render Books */}
                    {books.length > 0 ? (
                        books.map((book) => (
                            <div key={book.book_id} className="book-card">
                                {/* Admin Checkbox */}
                                {isAdmin && (
                                    <input
                                        type="checkbox"
                                        className="book-checkbox"
                                        onChange={() => handleCheckboxChange(book.book_id)}
                                        checked={selectedBooks.includes(book.book_id)}
                                    />
                                )}
                                {/* Book Cover Image */}
                                <img
                                    src={book.image_url}
                                    alt={book.title}
                                    className="book-image"
                                    onError={(e) => (e.target.src = "http://127.0.0.1:5000/static/images/default.jpg")}
                                />
                                {/* Book Details */}
                                <div className="book-details">
                                    <h3>{book.title}</h3>
                                    <p><strong>Author:</strong> {book.author}</p>
                                    <p><strong>Total Copies:</strong> {book.total_copies}</p>
                                    <p><strong>Available:</strong> {book.available_copies}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No books found.</p>
                    )}
                </div>
            )}

            {/* 🗑️ Admin-Only Delete Button */}
            {isAdmin && (
                <button className="delete-button" onClick={handleDelete}>
                    🗑 Delete Selected Books
                </button>
            )}

            {/* 🔙 Back Button */}
            <button className="back-button" onClick={() => navigate("/library")}>
                🔙 Back To Library Home
            </button>
        </div>
    );
}
