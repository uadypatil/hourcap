import { CircularProgress } from "@mui/material";
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, loggedIn } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center"><CircularProgress aria-label="Loading" /></div>;
  return loggedIn ? <>{children}</> : <Navigate to="/login" replace />;
};
export default PrivateRoute;
