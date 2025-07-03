import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
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
    const API_BASE_URL = "http://127.0.0.1:8080";

    const token = localStorage.getItem("token");
    const decodedToken = token ? jwtDecode(token) : null;
    const currentUserId = decodedToken?.user_id || null;
    const isAdmin = decodedToken?.role?.toLowerCase() === "admin";

    useEffect(() => {
        fetchBooks();
    }, [searchQuery]);

    const fetchBooks = async () => {
        setLoading(true);
        try {
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
            const response = await axios.get(`${API_BASE_URL}/validate-user`, {
                params: { user_input: adminBorrowUser.trim() },
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });

            setValidatedUserId(response.data.user_id);
            alert("✅ User validated successfully!");
        } catch (err) {
            alert(err.response?.data?.error || "❌ User not found.");
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
        setBorrowError("");

        if (!token) {
            alert("Missing auth token.");
            return;
        }

        if (selectedBooks.length === 0) {
            alert("Please select at least one book to borrow.");
            return;
        }

        if (selectedBooks.length > 3) {
            alert("You can only borrow up to 3 books at a time.");
            return;
        }

        let userId = currentUserId;

        if (isAdmin) {
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
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                }
            );

            alert("✅ Books borrowed successfully!");
            setSelectedBooks([]);
            setAdminBorrowUser("");
            setValidatedUserId(null);
            await fetchBooks();
        } catch (err) {
            alert(err.response?.data?.error || "❌ Failed to borrow books.");
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

            {/* Admin Section */}
            {isAdmin && (
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
                    {validatedUserId && (
                        <p className="validated-user-msg">
                            🎯 Target User ID: <strong>{validatedUserId}</strong>
                        </p>
                    )}
                </div>
            )}

            {loading ? (
                <h3>🔄 Loading available books...</h3>
            ) : error ? (
                <div className="error-message">❌ {error}</div>
            ) : (
                <div className="table-container">
                    <table className="book-table">
                        <thead>
                            <tr>
                                <th>Select</th>
                                <th>Cover</th>
                                <th>Title</th>
                                <th>Author</th>
                                <th>Total Copies</th>
                                <th>Available</th>
                            </tr>
                        </thead>
                        <tbody>
                            {books.map((book) => (
                                <tr key={book.book_id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedBooks.includes(book.book_id)}
                                            onChange={() => handleCheckboxChange(book.book_id)}
                                            disabled={
                                                selectedBooks.length >= 3 &&
                                                !selectedBooks.includes(book.book_id)
                                            }
                                        />
                                    </td>
                                    <td>
                                        <img
                                            src={
                                                book.image_url ||
                                                `${API_BASE_URL}/static/images/default.jpg`
                                            }
                                            alt={book.title || "Untitled"}
                                            className="table-book-image"
                                            onError={(e) =>
                                                (e.target.src = `${API_BASE_URL}/static/images/default.jpg`)
                                            }
                                        />
                                    </td>
                                    <td>{book.title || "No Title"}</td>
                                    <td>{book.author || "Unknown"}</td>
                                    <td>{book.total_copies ?? 0}</td>
                                    <td>{book.available_copies ?? 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {borrowError && <div className="error-message">❌ {borrowError}</div>}

            {isAdmin && !validatedUserId && (
                <p className="warning-msg">⚠️ Admin must validate a user before borrowing.</p>
            )}

            <button
                className="borrow-button"
                onClick={handleBorrow}
                disabled={
                    selectedBooks.length === 0 ||
                    (isAdmin && !validatedUserId)
                }
            >
                📖 Borrow Selected Books
            </button>

            <button className="back-button" onClick={() => navigate("/library")}>
                🔙 Back To Library Home
            </button>
        </div>
    );
}
