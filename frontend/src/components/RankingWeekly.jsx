// RankingWeekly.jsx
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
        summaryList.sort((a, b) => (b.weekly_score || 0) - (a.weekly_score || 0));
        
        const podiumUsers = summaryList.slice(0, 3);
        const otherUsers = summaryList.slice(3);
        
        setPodium(podiumUsers);
        setOthers(otherUsers);
      })
      .catch((err) => console.error(err));
  }, [API_URL]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Podium Semanal</h1>
      <div className="flex flex-col md:flex-row md:justify-center items-center mb-8 space-y-4 md:space-y-0 md:space-x-4">
        {podium.map((user, index) => {
          // Defina os tamanhos para cada posição: 1º maior, 2º intermediário, 3º menor.
          let sizeClass = "";
          if (index === 0) {
            sizeClass = "h-36 w-36"; // 1º
          } else if (index === 1) {
            sizeClass = "h-28 w-28"; // 2º
          } else if (index === 2) {
            sizeClass = "h-24 w-24"; // 3º
          }
          return (
            <div key={user.id} className="flex flex-col items-center">
              <div className={`bg-white p-2 rounded-full border shadow ${sizeClass}`}>
                {user.profile_image ? (
                  <img src={user.profile_image} alt={user.username} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <div className="h-full w-full rounded-full bg-gray-300 flex items-center justify-center text-xl">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="mt-2 font-bold">{index + 1}º</div>
              <div className="text-sm">{user.username}</div>
              <div className="text-sm text-gray-500">Treinos: {user.weekly_score || 0}</div>
            </div>
          );
        })}
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
                <td className="py-2 border text-center px-2">{index + 4}</td>
                <td className="py-2 border text-center px-2">{user.username}</td>
                <td className="py-2 border text-center px-2">
                  {user.profile_image ? (
                    <img src={user.profile_image} alt={user.username} className="h-8 w-8 rounded-full mx-auto object-cover" />
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
