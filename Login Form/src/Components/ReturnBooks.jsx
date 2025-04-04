import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import "./ReturnBooks.css";

const API_URL = "http://localhost:5000/return_books";

export default function ReturnBooks({ token, role }) {
    console.log("🔹 Props received in ReturnBooks:", { token, role });

    const [hydrated, setHydrated] = useState(false);
    const [borrowedBooks, setBorrowedBooks] = useState([]);
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [messages, setMessages] = useState({ type: "", text: "" });
    const [searchQuery, setSearchQuery] = useState(""); // 🔍 For book title search
    const [userIdSearch, setUserIdSearch] = useState(""); // 🔍 For admin user ID search

    useEffect(() => {
        setHydrated(true);
    }, []);

    const authToken = token || Cookies.get("token") || (hydrated ? localStorage.getItem("token") : null);
    let userRole = role;
    let decodedToken = null;

    if (authToken) {
        try {
            decodedToken = jwtDecode(authToken);
            userRole = decodedToken?.role || "No Role Found";
        } catch (error) {
            console.error("❌ Error decoding token:", error);
        }
    }

    console.log("🔹 Token received:", authToken);
    console.log("👤 Extracted Role:", userRole);

    axios.defaults.headers.common["Authorization"] = authToken ? `Bearer ${authToken}` : "";
    axios.defaults.withCredentials = true;

    useEffect(() => {
        if (!authToken) {
            console.error("🚨 No token found! Check authentication flow.");
            setMessages({ type: "error", text: "Authentication required. Please log in." });
            return;
        }
        fetchBorrowedBooks();
    }, [authToken]);

    const fetchBorrowedBooks = async () => {
        try {
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${authToken}` },
                withCredentials: true
            });

            console.log("📥 Borrowed Books API Response:", response.data);

            if (!response.data || !Array.isArray(response.data.borrowed_books)) {
                console.error("❌ Unexpected response format:", response.data);
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
                user_id: book.user_id || null
            }));

            console.log("📖 Formatted Books:", formattedBooks);
            setBorrowedBooks(formattedBooks);
        } catch (error) {
            console.error("❌ Error fetching books:", error.response?.data || error.message);
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

    const returnBooks = async () => {
        if (selectedBooks.length === 0) {
            setMessages({ type: "error", text: "No books selected for return." });
            return;
        }

        try {
            console.log("📤 Returning books:", selectedBooks);

            const booksToReturn = borrowedBooks
                .filter((book) => selectedBooks.includes(book.book_id))
                .map((book) => ({
                    book_id: book.book_id,
                    user_id: userRole === "admin" ? book.user_id : undefined,
                }));

            const response = await axios.post(
                API_URL,
                {
                    book_ids: booksToReturn.map(b => b.book_id),
                    user_ids: booksToReturn.map(b => b.user_id).filter(Boolean)
                },
                {
                    headers: { Authorization: `Bearer ${authToken}` }
                }
            );

            console.log("✅ Return Response:", response.data);

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
            console.error("❌ Error returning books:", error.response?.data || error.message);
            setMessages({ type: "error", text: "Error returning books. Please try again." });
        }
    };

    const handleSelectAll = (e) => {
        setSelectedBooks(e.target.checked ? borrowedBooks.map((book) => book.book_id) : []);
    };

    // 🔍 Filter books based on search query and user ID (if admin)
    const filteredBooks = borrowedBooks.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (userRole !== "admin" || !userIdSearch || (book.user_id && book.user_id.toString().includes(userIdSearch)))
    );

    if (!hydrated) {
        return <div>Loading...</div>;
    }

    return (
        <div className="return-books-container">
            <h1>Return Borrowed Books</h1>

            {messages.text && (
                <div className={`return-books-messages ${messages.type}`}>
                    {messages.text}
                </div>
            )}

            {/* 🔍 Search bar for filtering books */}
            <input
                type="text"
                placeholder="Search books by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="return-books-search"
            />

            {/* 🔍 Admin-only search for user ID */}
            {userRole === "admin" && (
                <input
                    type="text"
                    placeholder="Search by User ID..."
                    value={userIdSearch}
                    onChange={(e) => setUserIdSearch(e.target.value)}
                    className="return-books-search-admin"
                />
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
                                    checked={selectedBooks.length === filteredBooks.length && filteredBooks.length > 0}
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

            <button onClick={returnBooks} className="return-books-btn" disabled={selectedBooks.length === 0}>
                {userRole === "admin" ? "Return Books for User" : "Return Selected Books"}
            </button>
            <button className="back-btn">
                <a href="/library">Back to Library</a>
            </button>
        </div>
    );
}
