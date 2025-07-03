import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./BookMaster.css";

const fetchBookMasterData = async () => {
    const token = localStorage.getItem("token");

    if (!token) return [];

    try {
        const response = await axios.get("http://127.0.0.1:8080/book_master", {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            withCredentials: true,
        });

        console.log("API Response:", response.data);
        return response.data.books || [];
    } catch (error) {
        console.error("Error fetching books:", error);
        throw error;
    }
};

export default function BookMaster() {
    const navigate = useNavigate();
    const { data: books, isLoading, error } = useQuery({
        queryKey: ["bookMaster"],
        queryFn: fetchBookMasterData,
        retry: 1,
        staleTime: 0,
        cacheTime: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    if (isLoading) return <h2>🔄 Loading Book Master Data...</h2>;

    if (error) {
        return (
            <div className="book-master-container">
                <h2 className="book-master-h2">❌ Error Loading Books</h2>
                <p>{error.response?.data?.message || "Something went wrong. Please try again."}</p>
                <button className="back-button" onClick={() => navigate("/library")}>
                    🔙 Back to Library
                </button>
            </div>
        );
    }

    return (
        <div className="book-master-container">
            <h1>Book Master</h1>
            <h2 className="book-master-h2">📚 Book Master List</h2>

            <button className="back-button" onClick={() => navigate("/library")}>
                🔙 Back to Library
            </button>

            {/* Table Wrapper */}
            <div className="book-master-table-container">
                <table className="book-master-table">
                    <thead>
                        <tr>
                            <th className="book-master-th">Title</th>
                            <th className="book-master-th">Author</th>
                            <th className="book-master-th">Total Copies</th>
                            <th className="book-master-th">Available Copies</th>
                        </tr>
                    </thead>
                    <tbody>
                        {books.length > 0 ? (
                            books.map((book, index) => (
                                <tr key={book.id || index} className="book-master-tr">
                                    <td className="book-master-td">{book.title}</td>
                                    <td className="book-master-td">{book.author}</td>
                                    <td className="book-master-td">{book.total_copies}</td>
                                    <td className="book-master-td">{book.available_copies}</td>
                                </tr>
                            ))
                        ) : (
                            <tr className="book-master-tr">
                                <td colSpan="4" className="book-master-td">
                                    No books available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
