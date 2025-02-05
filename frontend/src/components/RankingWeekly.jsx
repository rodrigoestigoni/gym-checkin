import React, { useEffect, useState } from "react";

const RankingWeekly = () => {
  const [podium, setPodium] = useState([]);
  const [others, setOthers] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${API_URL}/ranking/weekly`)
      .then((res) => res.json())
      .then((data) => {
        // Considerando que data.podium e data.summary são retornados pelo endpoint
        // Mas vamos recalcular o podium usando data.summary caso seja necessário
        let summaryList = data.summary || [];
        // Ordena a lista por weekly_score ou outro campo que represente a contagem da semana.
        // Supondo que cada item tenha um campo 'weekly_score' (se não, você pode calcular na hora ou usar 'points' se for o caso)
        summaryList.sort((a, b) => (b.weekly_score || 0) - (a.weekly_score || 0));
        
        // O podium será os 3 primeiros da lista ordenada
        const podiumUsers = summaryList.slice(0, 3);
        // O restante dos usuários
        const otherUsers = summaryList.slice(3);
        
        setPodium(podiumUsers);
        setOthers(otherUsers);
      })
      .catch((err) => console.error(err));
  }, [API_URL]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Podium Semanal</h1>
      <div className="flex flex-col md:flex-row md:justify-center items-end mb-8">
        {/* Segundo colocado (exibido à esquerda em desktop) */}
        {podium[1] && (
          <div className="flex flex-col items-center mx-2 mb-4 md:mb-0">
            <div
              className="bg-white p-2 rounded-full border shadow"
              style={{ height: "100px", width: "100px" }}
            >
              {podium[1].profile_image ? (
                <img
                  src={podium[1].profile_image}
                  alt={podium[1].username}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-gray-300 flex items-center justify-center text-2xl">
                  {podium[1].username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="mt-2 font-bold text-lg">2º</div>
            <div className="text-sm">{podium[1].username}</div>
            <div className="text-sm text-gray-500">Score: {podium[1].weekly_score || 0}</div>
          </div>
        )}
        {/* Primeiro colocado (central) */}
        {podium[0] && (
          <div className="flex flex-col items-center mx-2 mb-4 md:mb-0">
            <div
              className="bg-white p-2 rounded-full border shadow"
              style={{ height: "140px", width: "140px" }}
            >
              {podium[0].profile_image ? (
                <img
                  src={podium[0].profile_image}
                  alt={podium[0].username}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-gray-300 flex items-center justify-center text-3xl">
                  {podium[0].username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="mt-2 font-bold text-xl">1º</div>
            <div className="text-sm">{podium[0].username}</div>
            <div className="text-sm text-gray-500">Score: {podium[0].weekly_score || 0}</div>
          </div>
        )}
        {/* Terceiro colocado */}
        {podium[2] && (
          <div className="flex flex-col items-center mx-2 mb-4 md:mb-0">
            <div
              className="bg-white p-2 rounded-full border shadow"
              style={{ height: "90px", width: "90px" }}
            >
              {podium[2].profile_image ? (
                <img
                  src={podium[2].profile_image}
                  alt={podium[2].username}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-gray-300 flex items-center justify-center text-xl">
                  {podium[2].username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="mt-2 font-bold text-lg">3º</div>
            <div className="text-sm">{podium[2].username}</div>
            <div className="text-sm text-gray-500">Score: {podium[2].weekly_score || 0}</div>
          </div>
        )}
      </div>

      {/* Lista dos demais participantes com um design responsivo */}
      <h2 className="text-2xl font-bold mb-4 text-center">Outros Participantes</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded">
          <thead>
            <tr>
              <th className="py-2 border px-2">Posição</th>
              <th className="py-2 border px-2">Usuário</th>
              <th className="py-2 border px-2">Imagem</th>
              <th className="py-2 border px-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {others.map((user, index) => (
              <tr key={user.id}>
                <td className="py-2 border text-center px-2">{index + 4}</td>
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
