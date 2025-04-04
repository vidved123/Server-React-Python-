import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DeleteUser.css";

export default function DeleteUser() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [message, setMessage] = useState(null);

    // 🔍 Fetch users when component mounts
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get("http://127.0.0.1:5000/delete_user", {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    },
                    withCredentials: true,
                });

                console.log("✅ Fetched users:", response.data);
                setUsers(response.data.users || []);
            } catch (error) {
                console.error("❌ Fetch Error:", error);
                setMessage({ text: "Failed to fetch users!", type: "danger" });
            }
        };

        fetchUsers();
    }, []);

    // 🔥 Handle user deletion
    const handleDelete = async (e) => {
        e.preventDefault();

        if (!selectedUser) {
            setMessage({ text: "Please select a user!", type: "danger" });
            return;
        }

        try {
            await axios.delete("http://127.0.0.1:5000/delete_user", {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                withCredentials: true,
                data: { user_id: selectedUser }, // Axios requires `data` for DELETE body
            });

            setMessage({ text: "User deleted successfully!", type: "success" });
            setUsers(users.filter(user => user.id !== parseInt(selectedUser, 10)));
            setSelectedUser("");
        } catch (error) {
            console.error("❌ Delete Error:", error);
            setMessage({ text: error.response?.data?.error || "Failed to delete user!", type: "danger" });
        }
    };

    return (
        <div className="delete-user-container">
            <h1>Delete User</h1>
            {message && <p className={`message ${message.type}`}>{message.text}</p>}
            <form onSubmit={handleDelete}>
                <select
                    className="delete-user-select"
                    onChange={(e) => setSelectedUser(e.target.value)}
                    value={selectedUser}
                    required
                >
                    <option value="">Select A User</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.full_name} ({user.username})
                        </option>
                    ))}
                </select>
                <button type="submit" className="delete-button">Delete User</button>
            </form>
            <div className="back-button">
                <a href="/dashboard">Back To The Dashboard</a>
            </div>
        </div>
    );
}
