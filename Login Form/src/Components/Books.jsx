import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Books.css";

export default function Books() {
    const { book_id } = useParams(); // Get book_id from URL
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(`http://127.0.0.1:5000/book/${book_id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });

                setBook(response.data);
            } catch (err) {
                console.error("❌ Error fetching book:", err);
                setError(err.response?.data?.message || "Failed to fetch book.");
            } finally {
                setLoading(false);
            }
        };

        fetchBook();
    }, [book_id]);

    if (loading) return <h2>🔄 Loading book details...</h2>;

    if (error) {
        return (
            <div className="books-container">
                <h2>❌ Error</h2>
                <p>{error}</p>
                <button className="back-button" onClick={() => navigate("/library")}>
                    🔙 Back To Library Home
                </button>
            </div>
        );
    }

    return (
        <div className="books-container">
            <h2>📖 {book.title}</h2>
            <p><strong>Author:</strong> {book.author}</p>

            <button className="back-button" onClick={() => navigate("/library")}>
                🔙 Back To Library Home
            </button>
        </div>
    );
}
