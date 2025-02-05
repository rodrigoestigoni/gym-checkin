import React from "react";
import { Navigate } from "react-router-dom";

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Erro ao decodificar token:", error);
    return null;
  }
}

const PrivateRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const decodedToken = parseJwt(user.token);
  if (!decodedToken || !decodedToken.exp) {
    // Se não for possível decodificar ou não houver exp, desloga
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }
  
  // O campo exp vem em segundos; converta para milissegundos para comparar com Date.now()
  if (decodedToken.exp * 1000 < Date.now()) {
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default PrivateRoute;
