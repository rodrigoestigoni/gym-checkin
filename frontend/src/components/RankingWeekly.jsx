// frontend/src/components/RankingWeekly.jsx
import React, { useEffect, useState } from "react";

const RankingWeekly = () => {
  const [podium, setPodium] = useState([]);
  const [others, setOthers] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${API_URL}/ranking/weekly`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Podium received:", data.podium);
        console.log("Others received:", data.others);
        setPodium(data.podium || []);
        setOthers(data.others || []);
      })
      .catch((err) => console.error(err));
  }, [API_URL]);

  const groupedPodium = podium.reduce((acc, user) => {
    const rank = user.rank;
    if (!acc[rank]) acc[rank] = [];
    acc[rank].push(user);
    return acc;
  }, {});

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
              {user.weekly_score} treinos
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Podium Semanal</h1>
      {podium.length === 0 && others.length === 0 ? (
        <p className="text-center text-gray-500">Nenhum usuário com mais de 1 treino esta semana.</p>
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
                          <div className="bg-white p-2 rounded-full border-4 border-yellow-400 shadow-lg h-24 w-24 sm:h-28 sm:w-28">
                            {user.profile_image ? (
                              <img
                                src={user.profile_image}
                                alt={user.username}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold">
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
                <table className="min-w-full bg-white shadow rounded text-sm">
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
                        <td className="py-2 border text-center px-2">{user.weekly_score}</td>
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

export default RankingWeekly;