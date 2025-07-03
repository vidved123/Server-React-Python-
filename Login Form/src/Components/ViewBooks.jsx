import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ViewBooks.css";

export default function ViewBooks() {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchBooks();
    }, [searchQuery]);

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://127.0.0.1:8080/view_books", {
                params: { search: searchQuery },
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });

            if (response.data.is_admin !== undefined) {
                setIsAdmin(response.data.is_admin);
            }

            const sortedBooks = response.data.books.sort((a, b) => a.title.localeCompare(b.title));
            setBooks(sortedBooks);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load books.");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (bookId) => {
        setSelectedBooks((prevSelected) =>
            prevSelected.includes(bookId)
                ? prevSelected.filter((id) => id !== bookId)
                : [...prevSelected, bookId]
        );
    };

    const handleDelete = async () => {
        if (selectedBooks.length === 0) {
            alert("Please select at least one book to delete.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await axios.post(
                "http://127.0.0.1:8080/delete_books",
                { book_ids: selectedBooks },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                }
            );

            setBooks((prevBooks) => prevBooks.filter((book) => !selectedBooks.includes(book.book_id)));
            setSelectedBooks([]);
            alert("Books deleted successfully!");
        } catch (err) {
            alert("Failed to delete books.");
        }
    };

    return (
        <div className="container">
            <h1>📚 View Books</h1>

            <form className="search-form" onSubmit={(e) => e.preventDefault()}>
                <input
                    type="text"
                    placeholder="Search by title or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="button" onClick={fetchBooks}>Search</button>
            </form>

            {loading ? (
                <p>Loading books...</p>
            ) : error ? (
                <div className="flash-messages error">{error}</div>
            ) : books.length === 0 ? (
                <p>No books found.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            {isAdmin && <th>Select</th>}
                            <th>Image</th>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Total Copies</th>
                            <th>Available</th>
                        </tr>
                    </thead>
                    <tbody>
                        {books.map((book) => (
                            <tr key={book.book_id}>
                                {isAdmin && (
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedBooks.includes(book.book_id)}
                                            onChange={() => handleCheckboxChange(book.book_id)}
                                        />
                                    </td>
                                )}
                                <td>
                                    {book.image_url ? (
                                        <img
                                            src={book.image_url}
                                            alt={book.title}
                                            className="book-image"
                                            onError={(e) => {
                                                e.target.src = "http://127.0.0.1:8080/static/images/default.jpg";
                                            }}
                                        />
                                    ) : (
                                        <span className="no-image">No image</span>
                                    )}
                                </td>
                                <td>{book.title}</td>
                                <td>{book.author}</td>
                                <td>{book.total_copies}</td>
                                <td>{book.available_copies}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {isAdmin && books.length > 0 && (
                <button className="delete-button" onClick={handleDelete}>
                    🗑 Delete Selected Books
                </button>
            )}

            <button className="back-button" onClick={() => navigate("/library")}>
                🔙 Back To Library Home
            </button>
        </div>
    );
}
