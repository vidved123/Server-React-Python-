import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import axios from "axios";
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AddBooks from "./Components/AddBooks.jsx";
import AddUser from "./Components/AddUser.jsx";
import BookMaster from "./Components/BookMaster.jsx";
import Books from "./Components/Books.jsx";
import BorrowedBooks from "./Components/BorrowBooks.jsx";
import Dashboard from "./Components/Dashboard.jsx";
import DeleteBooks from "./Components/DeleteBooks.jsx";
import DeleteProfile from "./Components/DeleteProfile.jsx";
import DeleteUser from "./Components/DeleteUser.jsx";
import HomePage from "./Components/HomePage.jsx";
import LibraryHome from "./Components/LibraryHome.jsx";
import LoginForm from "./Components/LoginForm.jsx";
import Profile from "./Components/Profile.jsx";
import RegisterForm from "./Components/RegisterForm.jsx";
import ReturnBooks from "./Components/ReturnBooks.jsx";
import UpdateProfile from "./Components/UpdateProfile.jsx";
import ViewBooks from "./Components/ViewBooks.jsx";
import ViewBorrowedBooks from "./Components/ViewBorrowedBooks.jsx";
import ViewUser from "./Components/ViewUser.jsx";

const queryClient = new QueryClient();

// ✅ Authentication Check Function (Uses Axios Instead of XHR)
const validateToken = async () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No Token Found");

        const response = await axios.post("http://127.0.0.1:5000/auth/validate", {}, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            withCredentials: true,
        });

        return response.data;
    } catch (error) {
        console.error("❌ Auth Validation Error:", error);
        throw new Error(error.response?.data?.error || "Authentication Failed");
    }
};

// ✅ React Query Hook
const useAuth = () => {
    return useQuery({
        queryKey: ["Auth"],
        queryFn: validateToken,
        retry: 1,
        staleTime: 5 * 60 * 1000,
    });
};

// ✅ Updated Protected Route (Now Passes Token and Role)
const ProtectedRoute = ({ element }) => {
    const { data, isLoading, error } = useAuth();

    if (isLoading) return <p>Loading...</p>;
    if (error || !data?.valid) return <Navigate to="/" />;

    // ✅ Pass `token` and `role` as props to the protected component
    const Component = React.cloneElement(element, {
        token: localStorage.getItem("token"),
        role: data.role
    });

    return Component;
};

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <div className="app-container">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/register" element={<RegisterForm />} />
                    <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
                    <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
                    <Route path="/library" element={<ProtectedRoute element={<LibraryHome />} />} />
                    <Route path="/books" element={<ProtectedRoute element={<Books />} />} />
                    <Route path="/add_user" element={<ProtectedRoute element={<AddUser />} />} />
                    <Route path="/delete_user" element={<ProtectedRoute element={<DeleteUser />} />} />
                    <Route path="/view_users" element={<ProtectedRoute element={<ViewUser />} />} />
                    <Route path="/update_profile" element={<ProtectedRoute element={<UpdateProfile />} />} />
                    <Route path="/delete_profile" element={<ProtectedRoute element={<DeleteProfile />} />} />
                    <Route path="/book_master" element={<ProtectedRoute element={<BookMaster />} />} />
                    <Route path="/add_books" element={<ProtectedRoute element={<AddBooks />} />} />
                    <Route path="/view_books" element={<ProtectedRoute element={<ViewBooks />} />} />
                    <Route path="/delete_books" element={<ProtectedRoute element={<DeleteBooks />} />} />
                    <Route path="/borrow" element={<ProtectedRoute element={<BorrowedBooks />} />} />
                    <Route path="/view_borrowed_books" element={<ProtectedRoute element={<ViewBorrowedBooks />} />} />
                    <Route path="/return_books" element={<ProtectedRoute element={<ReturnBooks />} />} />
                </Routes>
            </div>
        </QueryClientProvider>
    );
}
