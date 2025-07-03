import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import "./ReturnBooks.css";

const API_URL = "http://localhost:8080/return_books";

export default function ReturnBooks({ token, role }) {
    const [hydrated, setHydrated] = useState(false);
    const [borrowedBooks, setBorrowedBooks] = useState([]);
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [messages, setMessages] = useState({ type: "", text: "" });
    const [searchQuery, setSearchQuery] = useState("");
    const [userIdSearch, setUserIdSearch] = useState("");
    const [adminUserId, setAdminUserId] = useState("");

    useEffect(() => {
        setHydrated(true);
    }, []);

    const authToken =
        token || Cookies.get("token") || (hydrated ? localStorage.getItem("token") : null);

    let userRole = role;
    let decodedToken = null;

    if (authToken) {
        try {
            decodedToken = jwtDecode(authToken);
            userRole = decodedToken?.role?.toLowerCase() || "no role found";
        } catch (error) {
            console.error("Error decoding token:", error);
        }
    }

    axios.defaults.headers.common["Authorization"] = authToken ? `Bearer ${authToken}` : "";
    axios.defaults.withCredentials = true;

    useEffect(() => {
        if (!authToken) {
            setMessages({ type: "error", text: "Authentication required. Please log in." });
            return;
        }
        fetchBorrowedBooks();
    }, [authToken]);

    const fetchBorrowedBooks = async () => {
        try {
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${authToken}` },
                withCredentials: true,
            });

            if (!response.data || !Array.isArray(response.data.borrowed_books)) {
                setMessages({ type: "error", text: "Unexpected response format from server." });
                return;
            }

            const formattedBooks = response.data.borrowed_books.map((book, index) => ({
                key: `book-${book.book_id || index}`,
                book_id: book.book_id,
                title: book.title,
                author: book.author,
                borrowed_date: book.borrowed_date,
                due_date: book.due_date,
                username: book.username || "Unknown",
                user_id: book.user_id || null,
            }));

            setBorrowedBooks(formattedBooks);
        } catch (error) {
            console.error("Error fetching books:", error.response?.data || error.message);
            setMessages({ type: "error", text: "Failed to fetch borrowed books." });
        }
    };

    const handleCheckboxChange = (bookId) => {
        setSelectedBooks((prevSelected) =>
            prevSelected.includes(bookId)
                ? prevSelected.filter((id) => id !== bookId)
                : [...prevSelected, bookId]
        );
    };

    const handleSelectAll = (e) => {
        setSelectedBooks(e.target.checked ? borrowedBooks.map((book) => book.book_id) : []);
    };

    const returnBooks = async () => {
        if (selectedBooks.length === 0) {
            setMessages({ type: "error", text: "No books selected for return." });
            return;
        }

        if (userRole === "admin" && !adminUserId) {
            setMessages({ type: "error", text: "Please enter a User ID to return books for." });
            return;
        }

        const payload = {
            book_ids: selectedBooks,
            user_ids: userRole === "admin" ? Array(selectedBooks.length).fill(adminUserId) : undefined,
        };

        console.log("📤 Sending return payload:", payload);

        try {
            const response = await axios.post(API_URL, payload, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.data || !response.data.message) {
                setMessages({ type: "error", text: "Unexpected response from server." });
                return;
            }

            setMessages({ type: "success", text: response.data.message });

            setBorrowedBooks((prevBooks) =>
                prevBooks.filter((book) => !selectedBooks.includes(book.book_id))
            );
            setSelectedBooks([]);
        } catch (error) {
            console.error("Error returning books:", error.response?.data || error.message);
            setMessages({
                type: "error",
                text:
                    error.response?.data?.error ||
                    "Error returning books. Please try again.",
            });
        }
    };

    const filteredBooks = borrowedBooks.filter(
        (book) =>
            book.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            (userRole !== "admin" || !userIdSearch || (book.user_id && book.user_id.toString().includes(userIdSearch)))
    );

    if (!hydrated) return <div>Loading...</div>;

    return (
        <div className="return-books-container">
            <h1>Return Borrowed Books</h1>

            {messages.text && (
                <div className={`return-books-messages ${messages.type}`}>
                    {messages.text}
                </div>
            )}

            <input
                type="text"
                placeholder="Search books by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="return-books-search"
            />

            {userRole === "admin" && (
                <>
                    <input
                        type="text"
                        placeholder="Search by User ID..."
                        value={userIdSearch}
                        onChange={(e) => setUserIdSearch(e.target.value)}
                        className="return-books-search-admin"
                    />
                    <input
                        type="text"
                        placeholder="Enter User ID to return books for"
                        value={adminUserId}
                        onChange={(e) => setAdminUserId(e.target.value)}
                        className="return-books-admin-user-id"
                    />
                </>
            )}

            {filteredBooks.length === 0 ? (
                <p className="return-books-no-data">No books found.</p>
            ) : (
                <table className="return-books-table">
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={
                                        selectedBooks.length === filteredBooks.length &&
                                        filteredBooks.length > 0
                                    }
                                />
                            </th>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Borrowed Date</th>
                            <th>Due Date</th>
                            {userRole === "admin" && <th>Username</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBooks.map((book) => (
                            <tr key={book.key}>
                                <td className="text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedBooks.includes(book.book_id)}
                                        onChange={() => handleCheckboxChange(book.book_id)}
                                    />
                                </td>
                                <td>{book.title}</td>
                                <td>{book.author}</td>
                                <td>{book.borrowed_date}</td>
                                <td>{book.due_date}</td>
                                {userRole === "admin" && <td>{book.username}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <button
                onClick={returnBooks}
                className="return-books-btn"
                disabled={selectedBooks.length === 0}
            >
                {userRole === "admin" ? "Return Books for User" : "Return Selected Books"}
            </button>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
                <a href="/library" className="return-books-back">
                    Back to Library
                </a>
            </div>
        </div>
    );
}
