import React, { useEffect, useState } from "react";

const RankingWeekly = () => {
  const [podium, setPodium] = useState([]);
  const [others, setOthers] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${API_URL}/ranking/weekly`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Dados retornados:", data);
        setPodium(data.podium || []);
        setOthers(data.others || []);
      })
      .catch((err) => console.error(err));
  }, [API_URL]);

  // Agrupa os usuários do podium por seu rank
  const groupedPodium = podium.reduce((acc, user) => {
    const rank = user.rank;
    if (!acc[rank]) acc[rank] = [];
    acc[rank].push(user);
    return acc;
  }, {});

  const renderPodiumGroup = (rank, users) => {
    return (
      <div key={rank} className="flex flex-col items-center mx-2">
        <div className="mb-2 font-bold text-lg">{rank}º Lugar</div>
        <div className="flex space-x-4">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col items-center">
              <div className="bg-white p-2 rounded-full border shadow h-24 w-24 md:h-28 md:w-28">
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
              <div className="text-sm mt-1">{user.username}</div>
              <div className="text-xs text-gray-500">
                Treinos: {user.weekly_score || 0}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Podium Semanal</h1>
      <div className="flex flex-col md:flex-row md:justify-center items-center mb-8 space-y-8 md:space-y-0 md:space-x-8">
        {Object.keys(groupedPodium)
          .sort((a, b) => a - b) // ordena os ranks em ordem crescente
          .map((rank) => renderPodiumGroup(rank, groupedPodium[rank]))}
      </div>

      <h2 className="text-2xl font-bold mb-4 text-center">Outros Participantes</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded">
          <thead>
            <tr>
              <th className="py-2 border px-2">Posição</th>
              <th className="py-2 border px-2">Usuário</th>
              <th className="py-2 border px-2">Imagem</th>
              <th className="py-2 border px-2">Treinos</th>
            </tr>
          </thead>
          <tbody>
            {others.map((user) => (
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
    </div>
  );
};

export default RankingWeekly;
