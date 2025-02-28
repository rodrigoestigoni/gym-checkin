// ChallengeRanking.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faMedal, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useChallenge } from '../contexts/ChallengeContext';

const ChallengeRanking = ({ user }) => {
  const { challengeId } = useParams();
  const { activeChallenge } = useChallenge();
  const [rankingData, setRankingData] = useState({
    podium: [],
    others: []
  });
  const [activeTab, setActiveTab] = useState("weekly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    let isMounted = true;
    
    const fetchRanking = async () => {
      if (!challengeId || !user?.token) return;
      
      try {
        console.log(`Buscando ranking para desafio ${challengeId} com período ${activeTab}`);
        const res = await fetch(`${API_URL}/challenges/${challengeId}/ranking?period=${activeTab}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        
        if (!isMounted) return;
        
        if (res.ok) {
          const data = await res.json();
          console.log("Dados de ranking recebidos:", data);
          
          // Garantir que data tem a estrutura esperada
          const formattedData = {
            podium: Array.isArray(data.podium) ? data.podium : [],
            others: Array.isArray(data.others) ? data.others : []
          };
          
          setRankingData(formattedData);
          setError(null);
        } else {
          console.error("Erro ao buscar ranking:", await res.text());
          setError("Erro ao carregar ranking");
        }
      } catch (err) {
        console.error("Erro ao buscar ranking:", err);
        if (isMounted) {
          setError("Erro de conexão");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    setLoading(true);
    fetchRanking();
    
    return () => {
      isMounted = false;
    };
  }, [challengeId, activeTab, user, API_URL]);

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
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
      <div className="bg-red-100 dark:bg-red-900 dark:bg-opacity-30 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded flex items-center">
        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
        <p>{error}</p>
      </div>
    );
  }

  // Prepara os dados do pódio
  const groupedPodium = rankingData?.podium?.reduce((acc, user) => {
    const rank = user.rank;
    if (!acc[rank]) acc[rank] = [];
    acc[rank].push(user);
    return acc;
  }, {}) || {};

  const renderPodiumGroup = (rank, users) => (
    <div key={rank} className="flex flex-col items-center mx-2">
      <div className="mb-2 font-bold text-lg">{rank}º Lugar</div>
      <div className="flex flex-wrap justify-center gap-2">
        {users.map((user) => (
          <div key={user.id} className="flex flex-col items-center">
            <div className="bg-white dark:bg-gray-700 p-2 rounded-full border shadow h-20 w-20 sm:h-24 sm:w-24">
              {user.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.username}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xl">
                  {user.username?.charAt(0).toUpperCase() || ""}
                </div>
              )}
            </div>
            <div className="text-xs mt-1">{user.username}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              {user.weekly_score || 0} check-ins
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Resto do componente...
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

      {(!rankingData.podium?.length && !rankingData.others?.length) ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum participante no ranking {activeTab === "weekly" ? "desta semana" : "geral"}.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-center items-center mb-8 space-y-4 sm:space-y-0 sm:space-x-8">
            {Object.keys(groupedPodium)
              .sort((a, b) => a - b)
              .map((rank) => renderPodiumGroup(rank, groupedPodium[rank]))}
          </div>

          {rankingData.others?.length > 0 && (
            <>
              <h2 className="text-2xl font-bold mb-4 text-center">Outros Participantes</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="py-3 px-4 text-left">Posição</th>
                      <th className="py-3 px-4 text-left">Usuário</th>
                      <th className="py-3 px-4 text-center">Check-ins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingData.others.map((user) => (
                      <tr key={user.id} className="border-b dark:border-gray-700">
                        <td className="py-3 px-4">{user.rank}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {user.profile_image ? (
                              <img
                                src={user.profile_image}
                                alt={user.username}
                                className="h-8 w-8 rounded-full mr-2 object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-2">
                                {user.username?.charAt(0).toUpperCase() || ""}
                              </div>
                            )}
                            <span>{user.username}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">{user.weekly_score || 0}</td>
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

export default ChallengeRanking;