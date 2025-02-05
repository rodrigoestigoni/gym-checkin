import React, { useEffect, useState } from "react";

const RankingWeekly = () => {
  const [podium, setPodium] = useState([]);
  const [others, setOthers] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${API_URL}/ranking/weekly`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Dados retornados:", data); // Debug para conferir o formato
        // Use o array "podium" retornado pelo endpoint
        setPodium(data.podium || []);
        // Para os outros, use os usuários do resumo que não estão no podium
        if (data.summary) {
          const podiumIds = (data.podium || []).map(u => u.id);
          setOthers(data.summary.filter(u => !podiumIds.includes(u.id)));
        }
      })
      .catch((err) => console.error(err));
  }, [API_URL]);

  // Função para renderizar cada item do podium com tamanho ajustado conforme a posição
  const renderPodiumItem = (user, position) => {
    if (!user) return null;
    let sizeClass = "";
    switch (position) {
      case 1:
        sizeClass = "h-36 w-36";
        break;
      case 2:
        sizeClass = "h-28 w-28";
        break;
      case 3:
        sizeClass = "h-24 w-24";
        break;
      default:
        sizeClass = "h-24 w-24";
    }
    return (
      <div key={user.id} className="flex flex-col items-center mx-2">
        <div className={`bg-white p-2 rounded-full border shadow ${sizeClass}`}>
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
        <div className={`mt-2 font-bold ${position === 1 ? "text-xl" : "text-lg"}`}>
          {position}º
        </div>
        <div className="text-sm">{user.username}</div>
        <div className="text-sm text-gray-500">
        Treinos: {user.weekly_score || 0} (Proj: {user.calculated_points || 0})
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Podium Semanal</h1>
      <div className="flex flex-col md:flex-row md:justify-center items-center mb-8 space-y-4 md:space-y-0 md:space-x-4">
        {podium.length > 0 && renderPodiumItem(podium[0], 1)}
        {podium.length > 1 && renderPodiumItem(podium[1], 2)}
        {podium.length > 2 && renderPodiumItem(podium[2], 3)}
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
            {others.map((user, index) => (
              <tr key={user.id}>
                <td className="py-2 border text-center px-2">{index + podium.length + 1}</td>
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
