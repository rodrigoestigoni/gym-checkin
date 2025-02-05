import React from "react";
import { Navigate } from "react-router-dom";
import jwt_decode from "jwt-decode";

const PrivateRoute = ({ user, children }) => {
  // Se não houver usuário, redirecione para login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decodedToken = jwt_decode(user.token);
    // O token expira em segundos; convertemos para milissegundos e comparamos com Date.now()
    if (decodedToken.exp * 1000 < Date.now()) {
      // Se o token expirou, remova os dados persistidos e redirecione para login.
      localStorage.removeItem("user");
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    // Se ocorrer um erro na decodificação, considere o token inválido.
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
