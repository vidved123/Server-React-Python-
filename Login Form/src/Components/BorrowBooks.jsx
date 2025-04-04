import axios from "axios";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BorrowBooks.css";

export default function BorrowBooks() {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [borrowError, setBorrowError] = useState("");
    const [adminBorrowUser, setAdminBorrowUser] = useState("");
    const [validatedUserId, setValidatedUserId] = useState(null);
    const [role, setRole] = useState("");
    const API_BASE_URL = "http://127.0.0.1:5000";

    useEffect(() => {
        fetchBooks();
        getUserRole();
    }, [searchQuery]);

    const getUserRole = () => {
        const token = localStorage.getItem("token");
        if (token) {
            const decodedToken = jwtDecode(token);
            setRole(decodedToken.role);
        }
    };

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(`${API_BASE_URL}/borrow`, {
                params: { search: searchQuery.trim() },
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });

            setBooks(response.data.books || []);
            setError("");
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load books.");
        } finally {
            setLoading(false);
        }
    };

    const validateUser = async () => {
        if (!adminBorrowUser.trim()) {
            alert("Admin must enter a valid user ID or username.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const userCheckResponse = await axios.get(`${API_BASE_URL}/validate-user`, {
                params: { user_input: adminBorrowUser.trim() },
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });

            setValidatedUserId(userCheckResponse.data.user_id);
            alert("User validated successfully!");
        } catch (err) {
            alert(err.response?.data?.error || "User not found.");
            setValidatedUserId(null);
        }
    };

    const handleCheckboxChange = (bookId) => {
        setBorrowError("");

        setSelectedBooks((prevSelected) => {
            if (prevSelected.includes(bookId)) {
                return prevSelected.filter((id) => id !== bookId);
            } else {
                if (prevSelected.length >= 3) {
                    setBorrowError("You can only borrow up to 3 books at a time.");
                    return prevSelected;
                }
                return [...prevSelected, bookId];
            }
        });
    };

    const handleBorrow = async () => {
        if (selectedBooks.length === 0) {
            alert("Please select at least one book to borrow.");
            return;
        }

        if (selectedBooks.length > 3) {
            setBorrowError("You can only borrow up to 3 books at a time.");
            return;
        }

        const token = localStorage.getItem("token");
        let userId = null;

        if (token) {
            const decodedToken = jwtDecode(token);
            userId = decodedToken.user_id;
        }

        if (role === "admin") {
            if (!validatedUserId) {
                alert("Admin must validate a user before borrowing.");
                return;
            }
            userId = validatedUserId;
        }

        try {
            await axios.post(
                `${API_BASE_URL}/borrow`,
                { book_ids: selectedBooks, user_id: userId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    withCredentials: true,
                }
            );

            alert("Books borrowed successfully!");
            setSelectedBooks([]);
            setAdminBorrowUser("");
            setValidatedUserId(null);
            fetchBooks();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to borrow books.");
        }
    };

    return (
        <div className="borrow-books-container">
            <h2>📚 Borrow Books</h2>

            <input
                type="text"
                placeholder="🔍 Search by title, author, or book ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
            />

            {role === "admin" && (
                <div className="admin-validation">
                    <input
                        type="text"
                        placeholder="Enter User ID or Username (Admin Only)"
                        value={adminBorrowUser}
                        onChange={(e) => setAdminBorrowUser(e.target.value)}
                        className="admin-user-input"
                    />
                    <button className="validate-user-button" onClick={validateUser}>
                        ✅ Validate User
                    </button>
                </div>
            )}

            {loading ? (
                <h3>🔄 Loading available books...</h3>
            ) : error ? (
                <div className="error-message">❌ {error}</div>
            ) : (
                <div className="book-list">
                    {books.length > 0 ? (
                        books.map((book) => (
                            <div key={book.id} className="book-card">
                                <input
                                    type="checkbox"
                                    className="book-checkbox"
                                    onChange={() => handleCheckboxChange(book.id)}
                                    checked={selectedBooks.includes(book.id)}
                                    disabled={selectedBooks.length >= 3 && !selectedBooks.includes(book.id)}
                                />
                                <img
                                    src={book.image.startsWith("/static") ? `${API_BASE_URL}${book.image}` : book.image}
                                    alt={book.title}
                                    className="book-image"
                                    onError={(e) => {
                                        e.target.src = `${API_BASE_URL}/static/images/default.jpg`;
                                    }}
                                />
                                <div className="book-details">
                                    <h3>{book.title}</h3>
                                    <p><strong>Author:</strong> {book.author}</p>
                                    <p><strong>Total Copies:</strong> {book.total_copies}</p>
                                    <p><strong>Available:</strong> {book.available_copies}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No books available for borrowing.</p>
                    )}
                </div>
            )}

            {borrowError && <div className="error-message">❌ {borrowError}</div>}

            <button
                className="borrow-button"
                onClick={handleBorrow}
                disabled={selectedBooks.length === 0 || (role === "admin" && !validatedUserId)}
            >
                📖 Borrow Selected Books
            </button>

            <button className="back-button" onClick={() => navigate("/library")}>
                🔙 Back To Library Home
            </button>
        </div>
    );
}
