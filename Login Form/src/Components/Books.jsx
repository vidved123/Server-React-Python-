// Books.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Books.css";

export default function Books() {
    const [books, setBooks] = useState([]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://127.0.0.1:8080/books", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data.books.length === 0) {
                    setMessage("No books available."); // Set message if no books are found
                } else {
                    setBooks(res.data.books);
                }
            } catch (err) {
                setError("Failed to fetch books."); // Set error message if there is an issue fetching books
                console.error(err);
            }
        };

        fetchBooks();
    }, []);

    return (
        <div className="book-list-container">
            <h1>Available Books</h1>
            {message && <p>{message}</p>}
            {error && <p className="error">{error}</p>}

            <ul>
                {books.map((book) => (
                    <li key={book.id}>
                        <span>{book.title} by {book.author}</span>
                        <Link to={`/book/${book.id}`}>Borrow Book</Link>
                    </li>
                ))}
            </ul>

            {/* Optional debug */}
            <pre>{JSON.stringify(books, null, 2)}</pre>
        </div>
    );
}
