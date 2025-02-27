// frontend/src/components/ChallengeRanking.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faTrophy, faMedal } from '@fortawesome/free-solid-svg-icons';

const ChallengeRanking = ({ user }) => {
  const { challengeId } = useParams();
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [rankingData, setRankingData] = useState(null);
  const [activeTab, setActiveTab] = useState("weekly");
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (challengeId && user) {
      fetch(`${API_URL}/challenge-participation/`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          const challenge = data.find((p) => p.challenge.id === parseInt(challengeId));
          if (challenge) setSelectedChallenge(challenge.challenge);
        })
        .catch((err) => console.error(err));
    }
  }, [challengeId, user, API_URL]);

  useEffect(() => {
    if (selectedChallenge && user) {
      fetch(`${API_URL}/challenges/${selectedChallenge.id}/ranking?period=${activeTab}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
        .then((res) => res.json())
        .then((data) => setRankingData(data))
        .catch((err) => console.error(err));
    }
  }, [selectedChallenge, activeTab, user, API_URL]);

  if (!user) return <p>Por favor, faça login.</p>;

  if (!selectedChallenge) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Ranking de Desafios</h2>
        <p>Selecione um desafio nos seus desafios participados para ver o ranking.</p>
      </div>
    );
  }

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
            <div className="bg-white p-2 rounded-full border shadow h-20 w-20 sm:h-24 sm:w-24">
              {user.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.username}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-gray-300 flex items-center justify-center text-xl">
                  {user.username?.charAt(0).toUpperCase() || ""}
                </div>
              )}
            </div>
            <div className="text-xs mt-1">{user.username}</div>
            <div className="text-[10px] text-gray-500">
              {user.weekly_score || 0} check-ins
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center mb-4">
        <Link to="/challenges" className="text-blue-500 hover:underline mr-4">
          <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
          Voltar aos Desafios
        </Link>
        <h2 className="text-3xl font-bold">Ranking: {selectedChallenge.title}</h2>
      </div>
      <div className="flex border-b mb-4">
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${
            activeTab === "weekly" ? "border-b-2 border-green-500 font-bold" : "text-gray-600"
          }`}
          onClick={() => setActiveTab("weekly")}
        >
          <FontAwesomeIcon icon={faTrophy} className="mr-2" />
          Semanal
        </button>
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${
            activeTab === "overall" ? "border-b-2 border-green-500 font-bold" : "text-gray-600"
          }`}
          onClick={() => setActiveTab("overall")}
        >
          <FontAwesomeIcon icon={faMedal} className="mr-2" />
          Geral
        </button>
      </div>
      {rankingData ? (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-center items-center mb-8 space-y-4 sm:space-y-0 sm:space-x-8">
            {Object.keys(groupedPodium)
              .sort((a, b) => a - b)
              .map((rank) => renderPodiumGroup(rank, groupedPodium[rank]))}
          </div>
          {rankingData.others.length > 0 && (
            <>
              <h2 className="text-2xl font-bold mb-4 text-center">Outros Participantes</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white shadow rounded text-sm">
                  <thead>
                    <tr>
                      <th className="py-2 border px-2">Posição</th>
                      <th className="py-2 border px-2">Usuário</th>
                      <th className="py-2 border px-2">Imagem</th>
                      <th className="py-2 border px-2">Check-ins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingData.others.map((user) => (
                      <tr key={user.id}>
                        <td className="py-2 border text-center px-2">{user.rank}</td>
                        <td className="py-2 border text-center px-2">{user.username}</td>
                        <td className="py-2 border text-center px-2">
                          {user.profile_image ? (
                            <img
                              src={user.profile_image}
                              alt={user.username}
                              className="h-8 w-8 rounded-full mx-auto object-cover"
                            />
                          ) : (
                            <span className="text-gray-500">Sem imagem</span>
                          )}
                        </td>
                        <td className="py-2 border text-center px-2">{user.weekly_score || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      ) : (
        <p className="text-center">Carregando ranking...</p>
      )}
    </div>
  );
};

export default ChallengeRanking;