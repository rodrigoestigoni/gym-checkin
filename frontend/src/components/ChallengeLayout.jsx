// src/components/ChallengeLayout.jsx - Corrigido para desafios não iniciados
import React, { useEffect, useRef } from 'react';
import { useParams, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useChallenge } from '../contexts/ChallengeContext';
import ChallengeDashboard from './ChallengeDashboard';
import ChallengeCheckins from './ChallengeCheckins';
import ChallengeHistory from './ChallengeHistory';
import ChallengeRanking from './ChallengeRanking';

const ChallengeLayout = ({ user }) => {
  const { challengeId } = useParams();
  const { activeChallenge, setActiveChallenge } = useChallenge();
  const navigate = useNavigate();
  const effectRan = useRef(false);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    // Prevenir execuções redundantes em modo estrito
    if (effectRan.current) return;
    
    let isMounted = true;
    
    const fetchChallenge = async () => {
      if (!challengeId || !user?.token) return;
      
      try {
        console.log("ChallengeLayout: Buscando informações do desafio", challengeId);
        
        const res = await fetch(`${API_URL}/challenges/${challengeId}`, {
          headers: { 
            Authorization: `Bearer ${user.token}`,
            "Cache-Control": "no-cache"
          },
        });
        
        if (!isMounted) return;
        
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            console.log("ChallengeLayout: Desafio encontrado e armazenado no contexto");
            setActiveChallenge(data);
          }
        } else {
          console.error("ChallengeLayout: Erro ao buscar desafio");
          if (isMounted) {
            navigate('/challenges');
          }
        }
      } catch (err) {
        console.error("ChallengeLayout: Erro na requisição", err);
        if (isMounted) {
          navigate('/challenges');
        }
      } finally {
        if (isMounted) {
          effectRan.current = true;
        }
      }
    };

    fetchChallenge();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [challengeId, user?.token, navigate, setActiveChallenge]);

  if (!activeChallenge && !effectRan.current) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Verificar se o desafio já iniciou
  const isStarted = activeChallenge && new Date(activeChallenge.start_date) <= new Date();

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <h1 className="text-2xl font-bold mb-2">{activeChallenge?.title || "Carregando..."}</h1>
        <p className="text-gray-600 dark:text-gray-400">{activeChallenge?.description || ""}</p>
        
        {activeChallenge && !isStarted && (
          <div className="mt-3 bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-30 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-3 rounded">
            <p className="font-bold">Desafio ainda não iniciado</p>
            <p className="text-sm">
              Início previsto: {new Date(activeChallenge.start_date).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      <div className="flex overflow-x-auto mb-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <NavLink 
          to={`/challenge/${challengeId}/dashboard`} 
          className={({ isActive }) => `flex-1 px-4 py-3 text-center ${isActive ? 'border-b-2 border-green-500 font-bold' : 'text-gray-600'}`}
        >
          Dashboard
        </NavLink>
        
        {/* Só mostra aba de Check-ins se o desafio já tiver iniciado */}
        {isStarted && (
          <NavLink 
            to={`/challenge/${challengeId}/checkins`} 
            className={({ isActive }) => `flex-1 px-4 py-3 text-center ${isActive ? 'border-b-2 border-green-500 font-bold' : 'text-gray-600'}`}
          >
            Check-ins
          </NavLink>
        )}
        
        <NavLink 
          to={`/challenge/${challengeId}/history`} 
          className={({ isActive }) => `flex-1 px-4 py-3 text-center ${isActive ? 'border-b-2 border-green-500 font-bold' : 'text-gray-600'}`}
        >
          Histórico
        </NavLink>
        
        <NavLink 
          to={`/challenge/${challengeId}/ranking`} 
          className={({ isActive }) => `flex-1 px-4 py-3 text-center ${isActive ? 'border-b-2 border-green-500 font-bold' : 'text-gray-600'}`}
        >
          Ranking
        </NavLink>
      </div>

      <Routes>
        <Route path="dashboard" element={<ChallengeDashboard user={user} />} />
        <Route path="checkins" element={isStarted ? <ChallengeCheckins user={user} /> : <Navigate to={`/challenge/${challengeId}/dashboard`} replace />} />
        <Route path="history" element={<ChallengeHistory user={user} />} />
        <Route path="ranking" element={<ChallengeRanking user={user} />} />
        <Route path="*" element={<Navigate to={`/challenge/${challengeId}/dashboard`} replace />} />
      </Routes>
    </div>
  );
};

export default ChallengeLayout;