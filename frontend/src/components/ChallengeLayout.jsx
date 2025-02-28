// src/components/ChallengeLayout.jsx
import React, { useEffect } from 'react';
import { useParams, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useChallenge } from '../contexts/ChallengeContext';
import ChallengeDashboard from './ChallengeDashboard';
import ChallengeCheckins from './ChallengeCheckins';
import ChallengeHistory from './ChallengeHistory';
import ChallengeRanking from './ChallengeRanking';
import { api } from '../services/api';

const ChallengeLayout = ({ user }) => {
  const { challengeId } = useParams();
  const { activeChallenge, setActiveChallenge } = useChallenge();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const res = await api.getChallengeById(user.token, challengeId);
        if (res.ok) {
          const data = await res.json();
          setActiveChallenge(data);
        } else {
          navigate('/challenges');
        }
      } catch (err) {
        console.error(err);
        navigate('/challenges');
      }
    };

    fetchChallenge();
  }, [challengeId, user.token]);

  if (!activeChallenge) return <div>Carregando desafio...</div>;

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <h1 className="text-2xl font-bold mb-2">{activeChallenge.title}</h1>
        <p className="text-gray-600 dark:text-gray-400">{activeChallenge.description}</p>
      </div>

      <div className="flex overflow-x-auto mb-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <NavLink 
          to={`/challenge/${challengeId}/dashboard`} 
          className={({ isActive }) => `flex-1 px-4 py-3 text-center ${isActive ? 'border-b-2 border-green-500 font-bold' : 'text-gray-600'}`}
        >
          Dashboard
        </NavLink>
        <NavLink 
          to={`/challenge/${challengeId}/checkins`} 
          className={({ isActive }) => `flex-1 px-4 py-3 text-center ${isActive ? 'border-b-2 border-green-500 font-bold' : 'text-gray-600'}`}
        >
          Check-ins
        </NavLink>
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
        <Route path="checkins" element={<ChallengeCheckins user={user} />} />
        <Route path="history" element={<ChallengeHistory user={user} />} />
        <Route path="ranking" element={<ChallengeRanking user={user} />} />
        <Route path="*" element={<Navigate to={`/challenge/${challengeId}/dashboard`} replace />} />
      </Routes>
    </div>
  );
};

export default ChallengeLayout;