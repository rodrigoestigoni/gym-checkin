// EnhancedChallengeRanking.jsx - Updated to match original style
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faMedal, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useChallenge } from '../contexts/ChallengeContext';

const EnhancedChallengeRanking = ({ user }) => {
  const { challengeId } = useParams();
  const { activeChallenge } = useChallenge();
  const [rankingData, setRankingData] = useState({
    podium: [],
    others: []
  });
  const [activeTab, setActiveTab] = useState("weekly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const effectRan = useRef(false);
  const fetchInProgress = useRef(false);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  // Function to fetch ranking data
  const fetchRanking = async (period) => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_URL}/challenges/${challengeId}/ranking?period=${period}`, {
        headers: { 
          Authorization: `Bearer ${user.token}`,
          "Cache-Control": "no-cache"
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log("Challenge ranking data:", data);
        
        // Make sure data has the expected structure
        const formattedData = {
          podium: Array.isArray(data.podium) ? data.podium : [],
          others: Array.isArray(data.others) ? data.others : []
        };
        
        setRankingData(formattedData);
        setError(null);
      } else {
        console.error("Error fetching challenge ranking:", await res.text());
        setError("Erro ao carregar ranking");
      }
    } catch (err) {
      console.error("Error fetching challenge ranking:", err);
      setError("Erro de conexão");
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (effectRan.current) return;
    if (!challengeId || !user?.token) return;
    
    fetchRanking(activeTab);
    effectRan.current = true;
  }, [challengeId, user?.token, activeTab]);

  // Handle tab change
  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      fetchRanking(tab);
    }
  };

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

  const groupedPodium = rankingData.podium?.reduce((acc, user) => {
    const rank = user.rank;
    if (!acc[rank]) acc[rank] = [];
    acc[rank].push(user);
    return acc;
  }, {}) || {};

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-center mb-6">
        <div className="flex border-b mb-4 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <button
            className={`px-4 py-2 focus:outline-none flex items-center ${
              activeTab === "weekly" ? "bg-green-500 text-white" : "text-gray-600 dark:text-gray-300"
            }`}
            onClick={() => handleTabChange("weekly")}
          >
            <FontAwesomeIcon icon={faTrophy} className="mr-2" />
            Semanal
          </button>
          <button
            className={`px-4 py-2 focus:outline-none flex items-center ${
              activeTab === "overall" ? "bg-green-500 text-white" : "text-gray-600 dark:text-gray-300"
            }`}
            onClick={() => handleTabChange("overall")}
          >
            <FontAwesomeIcon icon={faMedal} className="mr-2" />
            Geral
          </button>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-4 text-center">
        {activeChallenge?.title || 'Ranking do Desafio'}
      </h1>
      
      {(!rankingData.podium?.length && !rankingData.others?.length) ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Nenhum participante no ranking {activeTab === "weekly" ? "desta semana" : "geral"}.
        </p>
      ) : (
        <>
          {/* Using the original RankingWeekly style for podium */}
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

          {/* Using original table-based layout for "Others" */}
          {rankingData.others?.length > 0 && (
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
                    {rankingData.others.map((user) => (
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

export default EnhancedChallengeRanking;