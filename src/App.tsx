import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const isAuthenticated = Boolean(localStorage.getItem("token"));

  return isAuthenticated ? (<Outlet />) : (<Navigate to="/" replace />);
}