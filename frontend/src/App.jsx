import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { ChallengeProvider, useChallenge } from './contexts/ChallengeContext';
import Header from "./components/Header";
import Login from "./components/Login";
import Register from "./components/Register";
import RankingTabs from "./components/RankingTabs";
import PrivateRoute from "./components/PrivateRoute";
import Profile from "./components/Profile";
import ChallengesDashboard from "./components/ChallengesDashboard";
import ChallengeEdit from "./components/ChallengeEdit";
import ChallengeCreate from "./components/ChallengeCreate";
import ChallengeDetailByCode from "./components/ChallengeDetailByCode";
import ChallengeDetail from "./components/ChallengeDetail";
import ChallengeLayout from "./components/ChallengeLayout";
import ImprovedDashboard from "./components/ImprovedDashboard";

import NewDashboard from "./components/NewDashboard";
import EnhancedHistory from "./components/EnhancedHistory";

import { useAuth } from "./services/api";

// Componente intermediário para limpar o contexto ao navegar entre rotas
const RouteChangeHandler = ({ children }) => {
  const location = useLocation();
  const { clearActiveChallenge } = useChallenge();
  
  // Limpa o contexto de desafio quando navegamos para fora da área de desafios
  useEffect(() => {
    if (!location.pathname.includes('/challenge/')) {
      console.log('Navegando para fora da área de desafios, limpando contexto');
      clearActiveChallenge();
    }
  }, [location.pathname, clearActiveChallenge]);
  
  return <>{children}</>;
};

const App = () => {
  const [user, setUser] = useState(undefined);
  const { isTokenValid } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      
      // Verifica se o token ainda é válido
      if (isTokenValid(parsedUser.token)) {
        setUser(parsedUser);
      } else {
        // Token expirado, limpa o localStorage
        localStorage.removeItem("user");
        setUser(null);
        navigate('/login');
      }
    } else {
      setUser(null);
    }
  }, [isTokenValid, navigate]);

  // Configuração do modo escuro (dark mode)
  useEffect(() => {
    const storedDark = localStorage.getItem("darkMode");
    if (storedDark === "true" || storedDark === null) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white">
        <p className="text-xl">Carregando...</p>
      </div>
    );
  }

  return (
    <ChallengeProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-white">
        <Header user={user} setUser={setUser} />
        <div className="container mx-auto p-4">
          <RouteChangeHandler>
            <Routes>
              <Route path="/login" element={<Login setUser={setUser} />} />
              <Route path="/register" element={<Register />} />
              
              {/* Redireciona o checkin para os desafios */}
              <Route path="/checkin" element={<PrivateRoute user={user}><Navigate to="/challenges" replace /></PrivateRoute>} />
              
              <Route path="/dashboard" element={<PrivateRoute user={user}><NewDashboard user={user} /></PrivateRoute>} />
              <Route path="/history" element={<PrivateRoute user={user}><EnhancedHistory user={user} /></PrivateRoute>} />
              <Route path="/ranking" element={<PrivateRoute user={user}><RankingTabs /></PrivateRoute>} />

              <Route path="/profile" element={<PrivateRoute user={user}><Profile user={user} setUser={setUser} /></PrivateRoute>} />
              
              <Route path="/home" element={<PrivateRoute user={user}><NewDashboard user={user} /></PrivateRoute>} />
              
              <Route path="/challenges/*" element={<PrivateRoute user={user}><ChallengesDashboard user={user} /></PrivateRoute>} />
              <Route path="/challenges/:challengeId/edit" element={<PrivateRoute user={user}><ChallengeEdit user={user} /></PrivateRoute>} />
              <Route path="/challenges/create" element={<PrivateRoute user={user}><ChallengeCreate user={user} /></PrivateRoute>} />
              <Route path="/challenge/:code" element={<PrivateRoute user={user}><ChallengeDetailByCode user={user} /></PrivateRoute>} />
              <Route path="/challenges/:challengeId" element={<PrivateRoute user={user}><ChallengeDetail user={user} /></PrivateRoute>} />
              
              <Route path="/challenge/:challengeId/*" element={
                <PrivateRoute user={user}><ChallengeLayout user={user} /></PrivateRoute>
              } />
              
              <Route path="/" element={<PrivateRoute user={user}><NewDashboard user={user} /></PrivateRoute>} />
            </Routes>
          </RouteChangeHandler>
        </div>
      </div>
    </ChallengeProvider>
  );
};

export default App;