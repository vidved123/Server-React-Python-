import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./ViewUser.css";

export default function ViewUser() {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get("http://127.0.0.1:8080/view_users", {
                    withCredentials: true,
                });

                console.log("✅ Fetched users:", response.data);

                if (Array.isArray(response.data.users)) {
                    setUsers(response.data.users);
                } else {
                    throw new Error("Unexpected API response format");
                }
            } catch (err) {
                console.error("❌ Error fetching users:", err);
                setError(err.response?.data?.error || err.message);
            }
        };

        fetchUsers();
    }, []);

    return (
        <div className="view-user-container">
            <h1>Users Roster</h1>

            {error && <p className="view-user-error-message">{error}</p>}

            <div className="view-user-table-container">
                <table className="view-user-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Country Code</th>
                            <th>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map((user, index) => (
                                <tr key={index}>
                                    <td>{user[0]}</td> {/* ID */}
                                    <td>{user[1]}</td> {/* Username */}
                                    <td>{user[2]}</td> {/* Full Name */}
                                    <td>{user[3]}</td> {/* Email */}
                                    <td>{user[4]}</td> {/* Phone */}
                                    <td>{user[5]}</td> {/* Country Code */}
                                    <td>{user[6]}</td> {/* Role */}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="view-user-no-data">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Link to="/dashboard" className="view-user-back-button">
                Back to Dashboard
            </Link>
        </div>
    );
}
