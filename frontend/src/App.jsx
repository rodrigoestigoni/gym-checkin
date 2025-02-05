import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Login from "./components/Login";
import Register from "./components/Register";
import CheckinForm from "./components/CheckinForm";
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import Ranking from "./components/Ranking";
import RankingWeekly from "./components/RankingWeekly";
import AdminPanel from "./components/AdminPanel";
import Profile from "./components/Profile";
import PrivateRoute from "./components/PrivateRoute";

const App = () => {
  // Inicialize "user" como undefined para indicar que ainda não foi carregado.
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    // Tente recuperar o usuário do localStorage.
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, []);

  // Enquanto o usuário estiver indefinido, exiba um carregamento.
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={user} setUser={setUser} />
      <div className="container mx-auto p-4">
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rotas protegidas */}
          <Route
            path="/checkin"
            element={
              <PrivateRoute user={user}>
                <CheckinForm user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute user={user}>
                <Dashboard user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/history"
            element={
              <PrivateRoute user={user}>
                <History user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/ranking"
            element={
              <PrivateRoute user={user}>
                <Ranking />
              </PrivateRoute>
            }
          />
          <Route
            path="/ranking-weekly"
            element={
              <PrivateRoute user={user}>
                <RankingWeekly />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute user={user}>
                <AdminPanel user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute user={user}>
                <Profile user={user} setUser={setUser} />
              </PrivateRoute>
            }
          />
          <Route
            path="/"
            element={
              <PrivateRoute user={user}>
                <Dashboard user={user} />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default App;
