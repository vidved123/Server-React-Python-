import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddBooks.css";

export default function AddBooks() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [manualBook, setManualBook] = useState({
        title: "",
        author: "",
        total_copies: "",
        image: null,
    });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event) => setFile(event.target.files[0]);

    const handleManualChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "image") {
            setManualBook({ ...manualBook, image: files[0] });
        } else {
            setManualBook({ ...manualBook, [name]: value });
        }
    };

    const handleUploadExcel = async () => {
        if (!file) return alert("⚠️ Please select an Excel file!");

        setLoading(true);
        const formData = new FormData();
        formData.append("excel_file", file);

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post("http://127.0.0.1:8080/add_books", formData, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                withCredentials: true,
            });

            setMessage(response.data.message || "✅ Books added from Excel!");
        } catch (error) {
            console.error(error);
            setMessage(error.response?.data?.error || "❌ Upload failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleUploadManual = async () => {
        const { title, author, total_copies, image } = manualBook;
        if (!title || !author || !total_copies || !image) {
            return alert("⚠️ Please fill out all fields and select an image.");
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("title", title);
        formData.append("author", author);
        formData.append("total_copies", total_copies);
        formData.append("image", image);

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post("http://127.0.0.1:8080/add_books", formData, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                withCredentials: true,
            });

            setMessage(response.data.message || "✅ Book added manually!");
        } catch (error) {
            console.error(error);
            setMessage(error.response?.data?.error || "❌ Failed to add book.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-books-container">
            <h2>📘 Add Books</h2>
            {message && <p className="message">{message}</p>}

            <h3>📥 Upload Excel</h3>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
            {file && <p>📂 Selected: {file.name}</p>}
            <button onClick={handleUploadExcel} className="upload-button" disabled={loading}>
                {loading ? "Uploading..." : "Upload Excel"}
            </button>

            <hr style={{ margin: "30px 0" }} />

            <h3>✍️ Add Book Manually</h3>
            <input
                type="text"
                name="title"
                placeholder="Book Title"
                value={manualBook.title}
                onChange={handleManualChange}
            />
            <input
                type="text"
                name="author"
                placeholder="Author"
                value={manualBook.author}
                onChange={handleManualChange}
            />
            <input
                type="number"
                name="total_copies"
                placeholder="Total Copies"
                value={manualBook.total_copies}
                onChange={handleManualChange}
            />
            <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleManualChange}
            />
            {manualBook.image && <p>🖼️ Selected: {manualBook.image.name}</p>}

            <button onClick={handleUploadManual} className="upload-button" disabled={loading}>
                {loading ? "Adding..." : "Add Book"}
            </button>

            <button onClick={() => navigate("/library")} className="back-link">
                Back to Library
            </button>
        </div>
    );
}
