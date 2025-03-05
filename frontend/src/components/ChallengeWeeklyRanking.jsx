// ChallengeWeeklyRanking.jsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const ChallengeWeeklyRanking = ({ user, challengeId }) => {
  const [podium, setPodium] = useState([]);
  const [others, setOthers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (!challengeId || !user?.token) return;
    
    setLoading(true);
    
    fetch(`${API_URL}/challenges/${challengeId}/ranking?period=weekly`, {
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
        console.log("Challenge weekly podium received:", data.podium);
        console.log("Challenge weekly others received:", data.others);
        setPodium(data.podium || []);
        setOthers(data.others || []);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching challenge weekly ranking:", err);
        setError("Erro ao carregar ranking semanal do desafio");
        setLoading(false);
      });
  }, [API_URL, challengeId, user?.token]);

  const groupedPodium = podium.reduce((acc, user) => {
    const rank = user.rank;
    if (!acc[rank]) acc[rank] = [];
    acc[rank].push(user);
    return acc;
  }, {});

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
      {podium.length === 0 && others.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Nenhum participante no ranking semanal deste desafio.</p>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-center items-center mb-8 space-y-6 sm:space-y-0">
            {Object.keys(groupedPodium)
              .sort((a, b) => a - b)
              .map((rank) => (
                <div key={rank} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mx-2 text-center">
                  <div className="absolute -top-3 left-0 right-0 mx-auto w-fit bg-yellow-400 text-gray-900 px-3 py-1 rounded-full font-bold">
                    {rank}º Lugar
                  </div>
                  <div className="mt-4 pt-2 flex flex-wrap justify-center gap-4">
                    {groupedPodium[rank].map((user) => (
                      <div key={user.id} className="flex flex-col items-center">
                        <div className="relative">
                          <div className="bg-white dark:bg-gray-800 p-2 rounded-full border-4 border-yellow-400 shadow-lg h-24 w-24 sm:h-28 sm:w-28">
                            {user.profile_image ? (
                              <img
                                src={user.profile_image}
                                alt={user.username}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-2xl font-bold">
                                {user.username?.charAt(0).toUpperCase() || ""}
                              </div>
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                            {user.weekly_score}
                          </div>
                        </div>
                        <div className="text-sm mt-2 font-semibold">{user.username}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          {others.length > 0 && (
            <>
              <h2 className="text-2xl font-bold mb-4 text-center">Outros Participantes</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 shadow rounded text-sm">
                  <thead>
                    <tr>
                      <th className="py-2 border px-2 dark:border-gray-700">Posição</th>
                      <th className="py-2 border px-2 dark:border-gray-700">Usuário</th>
                      <th className="py-2 border px-2 dark:border-gray-700">Imagem</th>
                      <th className="py-2 border px-2 dark:border-gray-700">Treinos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {others.map((user) => (
                      <tr key={user.id}>
                        <td className="py-2 border text-center px-2 dark:border-gray-700">{user.rank}</td>
                        <td className="py-2 border text-center px-2 dark:border-gray-700">{user.username}</td>
                        <td className="py-2 border text-center px-2 dark:border-gray-700">
                          {user.profile_image ? (
                            <img
                              src={user.profile_image}
                              alt={user.username}
                              className="h-8 w-8 rounded-full mx-auto object-cover"
                            />
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">Sem imagem</span>
                          )}
                        </td>
                        <td className="py-2 border text-center px-2 dark:border-gray-700">{user.weekly_score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ChallengeWeeklyRanking;