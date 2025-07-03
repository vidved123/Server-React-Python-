import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddBooks.css";

export default function AddBooks() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            alert("⚠️ Please select a file first!"); // Alert if no file is selected
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("excel_file", file);

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post("http://127.0.0.1:8080/add_books", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${token}`,
                },
                withCredentials: true,
            });

            setMessage(response.data.message || "✅ Books added successfully!"); // Display success message
        } catch (error) {
            console.error("❌ Error uploading file:", error);

            if (error.response) {
                console.error("❌ Server Response:", error.response.data);
                setMessage(`❌ ${error.response.data.error || "Error uploading file. Try again."}`); // Display error message from server
            } else {
                setMessage("❌ Error connecting to server."); // Display and error message if no response from server
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-books-container">
            <h2>📖 Add Books</h2>
            {message && <p className="message">{message}</p>}

            <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
            {file && <p>📂 Selected: {file.name}</p>}

            <button onClick={handleUpload} className="upload-button" disabled={loading}>
                {loading ? "Uploading..." : "Upload Excel"}
            </button>

            <button onClick={() => navigate("/library")} className="back-button">
                Back To Library
            </button>
        </div>
    );
}
