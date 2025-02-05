import React, { useEffect, useState } from "react";

const RankingWeekly = () => {
  const [podium, setPodium] = useState([]);
  const [others, setOthers] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${API_URL}/ranking/weekly`)
      .then((res) => res.json())
      .then((data) => {
        // data.weekly contém a lista completa ordenada pela contagem real de checkins
        let summaryList = data.weekly || [];
        // Ordena os usuários por weekly_score (maior primeiro)
        summaryList.sort((a, b) => (b.weekly_score || 0) - (a.weekly_score || 0));

        // O podium será os 3 primeiros (ou menos, se não houver 3)
        const podiumUsers = summaryList.slice(0, 3);
        // Os demais participantes
        const otherUsers = summaryList.slice(3);

        setPodium(podiumUsers);
        setOthers(otherUsers);
      })
      .catch((err) => console.error(err));
  }, [API_URL]);

  // Função para renderizar cada posição do podium com tamanho diferenciado
  const renderPodiumItem = (user, position) => {
    if (!user) return null;
    let sizeClass = "";
    switch (position) {
      case 1: // Primeiro colocado
        sizeClass = "h-36 w-36"; // ex.: 144px
        break;
      case 2: // Segundo colocado
        sizeClass = "h-28 w-28"; // ex.: 112px
        break;
      case 3: // Terceiro colocado
        sizeClass = "h-24 w-24"; // ex.: 96px
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
        <div className="text-sm text-gray-500">Treinos: {user.weekly_score || 0}</div>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Podium Semanal</h1>
      <div
        className={`flex flex-col ${
          podium.length >= 3 ? "md:flex-row md:justify-center" : "justify-center"
        } items-center mb-8 space-y-4 md:space-y-0 md:space-x-4`}
      >
        {/* Renderiza o podium em ordem: 1º, 2º, 3º */}
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
