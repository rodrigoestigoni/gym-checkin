// ChallengeOverallRanking.jsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faMedal, faDumbbell, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const ChallengeOverallRanking = ({ user, challengeId }) => {
  const [overall, setOverall] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (!challengeId || !user?.token) return;
    
    setLoading(true);
    
    fetch(`${API_URL}/challenges/${challengeId}/ranking?period=overall`, {
      headers: { 
        Authorization: `Bearer ${user.token}`,
        "Cache-Control": "no-cache"
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar ranking do desafio");
        return res.json();
      })
      .then((data) => {
        console.log("Challenge overall ranking received:", data);
        
        const combinedData = [...(data.podium || []), ...(data.others || [])];
        
        const rankedData = combinedData.map((user, index) => ({
          ...user,
          rank: user.rank || index + 1,
          total_checkins: user.weekly_score || 0,
          points: user.points || user.challenge_points || 0 
        }));
        
        setOverall(rankedData);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching challenge overall ranking:", err);
        setError("Erro ao carregar ranking geral do desafio");
        setLoading(false);
      });
  }, [API_URL, challengeId, user?.token]);

  const getMedalIcon = (rank) => {
    switch (rank) {
      case 1:
        return <FontAwesomeIcon icon={faTrophy} className="text-yellow-400" />;
      case 2:
        return <FontAwesomeIcon icon={faMedal} className="text-gray-400" />;
      case 3:
        return <FontAwesomeIcon icon={faMedal} className="text-amber-600" />;
      default:
        return rank;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 dark:bg-opacity-20 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded flex items-center">
        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {overall.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Nenhum participante no ranking geral deste desafio.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 shadow rounded">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="py-3 px-4 border-b dark:border-gray-600">Posição</th>
                <th className="py-3 px-4 border-b dark:border-gray-600">Usuário</th>
                <th className="py-3 px-4 border-b dark:border-gray-600">Pontos</th>
                <th className="py-3 px-4 border-b dark:border-gray-600">
                  <div className="flex items-center justify-center">
                    <FontAwesomeIcon icon={faDumbbell} className="mr-2" />
                    Total de Treinos
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {overall.map((user) => (
                <tr 
                  key={user.id} 
                  className={`
                    hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                    ${user.rank <= 3 ? 'bg-green-50 dark:bg-green-900 dark:bg-opacity-20' : ''}
                  `}
                >
                  <td className="py-3 px-4 border-b dark:border-gray-600 text-center">
                    <div className="flex items-center justify-center text-xl">
                      {getMedalIcon(user.rank)}
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b dark:border-gray-600">
                    <div className="flex items-center">
                      {user.profile_image ? (
                        <img
                          src={user.profile_image}
                          alt={user.username}
                          className="h-10 w-10 rounded-full object-cover mr-3"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-3">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium">{user.username}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b dark:border-gray-600 text-center font-bold">
                    {user.challenge_points || user.points || 0}
                  </td>
                  <td className="py-3 px-4 border-b dark:border-gray-600 text-center">
                    <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 py-1 px-3 rounded-full">
                      {user.total_checkins || user.weekly_score || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ChallengeOverallRanking;