import React, { useEffect, useState } from "react";

const RankingWeekly = () => {
  const [podium, setPodium] = useState([]);
  const [others, setOthers] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${API_URL}/ranking/weekly`)
      .then((res) => res.json())
      .then((data) => {
        // Espera-se que data.podium tenha os top 3 em ordem e data.summary contenha todos os usuários ordenados por weeks_won
        setPodium(data.podium);
        // Para os demais, podemos filtrar da lista geral (excluindo os que estão no podium)
        // Se data.summary não for exatamente a lista dos demais, você pode ajustar conforme a resposta do seu endpoint.
        // Aqui, assumiremos que data.summary contém todos os usuários e que os três primeiros são os podium.
        if (data.summary && data.summary.length > 3) {
          setOthers(data.summary.slice(3));
        } else {
          setOthers([]);
        }
      })
      .catch((err) => console.error(err));
  }, [API_URL]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Podium Semanal</h1>
      <div className="flex justify-center items-end mb-8">
        {/* Segundo colocado à esquerda */}
        {podium[1] && (
          <div className="flex flex-col items-center mx-4">
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
          </div>
        )}
        {/* Primeiro colocado ao centro */}
        {podium[0] && (
          <div className="flex flex-col items-center mx-4">
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
          </div>
        )}
        {/* Terceiro colocado à direita */}
        {podium[2] && (
          <div className="flex flex-col items-center mx-4">
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
          </div>
        )}
      </div>

      {/* Exibe a lista dos demais participantes */}
      <h2 className="text-2xl font-bold mb-4 text-center">Outros Participantes</h2>
      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th className="py-2 border">Posição</th>
            <th className="py-2 border">Usuário</th>
            <th className="py-2 border">Imagem</th>
            <th className="py-2 border">Pontos</th>
          </tr>
        </thead>
        <tbody>
          {others.map((user, index) => (
            <tr key={user.id}>
              <td className="py-2 border text-center">{index + 4}</td>
              <td className="py-2 border text-center">{user.username}</td>
              <td className="py-2 border text-center">
                {user.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt="perfil"
                    className="h-8 w-8 rounded-full mx-auto object-cover"
                  />
                ) : (
                  <span className="text-gray-500">Sem imagem</span>
                )}
              </td>
              <td className="py-2 border text-center">{user.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RankingWeekly;
