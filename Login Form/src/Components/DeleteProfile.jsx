import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DeleteProfile.css'; // Ensure this path is correct

export default function DeleteProfile() {
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const handleDelete = async () => {
        if (!window.confirm('⚠️ Are you sure you want to delete your profile? This action cannot be undone.')) {
            return; // Only proceed if the user confirms the deletion
        }
        try {
            const response = await axios.post("http://127.0.0.1:8080/profile/delete", {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                withCredentials: true,
            });

            if (response.status === 200) {
                setMessage({ text: 'Your profile has been successfully deleted', type: 'success' });
                localStorage.removeItem('token'); // Remove token after deletion
                setTimeout(() => navigate('/'), 2000); // Redirect to the home page after 2 seconds
            }
        } catch (error) {
            console.error("❌ Profile Delete Error:", error);
            setMessage({ text: error.response?.data?.error || 'Failed to delete profile', type: 'error' });
        }
    };

    return (
        <div className="delete-profile-container">
            <h2>Delete Profile</h2>
            {message && <p className={`message ${message.type}`}>{message.text}</p>}
            <button onClick={handleDelete} className="delete-button">
                Delete My Profile
            </button>
            <button onClick={() => navigate("/dashboard")} className="back-button">
                Cancel
            </button>
        </div>
    );
}
