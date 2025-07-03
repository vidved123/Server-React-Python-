import axios from "axios";
import React, { useEffect, useState } from "react";
import "./DeleteBooks.css";

export default function DeleteBooks() {
    const [books, setBooks] = useState([]);
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [message, setMessage] = useState("");

    // Fetch book list from backend
    useEffect(() => {
        axios
            .get("http://localhost:8080/books", { withCredentials: true })
            .then((response) => setBooks(response.data.books || []))
            .catch((error) => console.error("Error fetching books:", error));
    }, []);

    // Handle checkbox selection
    const handleCheckboxChange = (bookId) => {
        setSelectedBooks((prevSelected) =>
            prevSelected.includes(bookId)
                ? prevSelected.filter((id) => id !== bookId)
                : [...prevSelected, bookId]
        );
    };

    // Send DELETE request
    const handleDelete = async () => {
        if (selectedBooks.length === 0) {
            setMessage("Please select at least one book to delete.");
            return;
        }

        try {
            const response = await axios.post(
                "http://localhost:8080/delete_books",
                { book_ids: selectedBooks },
                { withCredentials: true }
            );

            if (response.status === 200) {
                setMessage("Books deleted successfully.");
                setBooks((prevBooks) => prevBooks.filter((book) => !selectedBooks.includes(book.id)));
                setSelectedBooks([]);
            } else {
                setMessage(response.data.error || "Failed to delete books.");
            }
        } catch (error) {
            setMessage(error.response?.data?.error || "An error occurred while deleting books.");
        }
    };

    return (
        <div className="delete-books-container">
            <h2>Delete Books</h2>
            {message && <p className={`message ${message.includes("success") ? "success" : "error"}`}>{message}</p>}
            <ul className="book-list">
                {books.map((book) => (
                    <li key={book.id}>
                        <input
                            type="checkbox"
                            onChange={() => handleCheckboxChange(book.id)}
                            checked={selectedBooks.includes(book.id)}
                        />
                        {book.title}
                    </li>
                ))}
            </ul>
            <button className="delete-button" onClick={handleDelete} disabled={selectedBooks.length === 0}>
                Delete Selected Books
            </button>
        </div>
    );
}
