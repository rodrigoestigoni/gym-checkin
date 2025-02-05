import React, { useEffect, useState } from "react";

const OverallRanking = () => {
  const [summary, setSummary] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${API_URL}/ranking/weekly`)
      .then((res) => res.json())
      .then((data) => {
        // Aqui, assumimos que data.summary contém a lista de usuários ordenados por weeks_won
        setSummary(data.summary);
      })
      .catch((err) => console.error(err));
  }, [API_URL]);

  return (
    <div className="overflow-x-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Ranking das Semanas</h2>
      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th className="py-2 border">Posição</th>
            <th className="py-2 border">Usuário</th>
            <th className="py-2 border">Imagem</th>
            <th className="py-2 border">Semanas Vencidas</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((item, index) => (
            <tr key={item.id}>
              <td className="py-2 border text-center">{index + 1}</td>
              <td className="py-2 border text-center">{item.username}</td>
              <td className="py-2 border text-center">
                {item.profile_image ? (
                  <img src={item.profile_image} alt={item.username} className="h-8 w-8 rounded-full mx-auto object-cover" />
                ) : (
                  <span className="text-gray-500">Sem imagem</span>
                )}
              </td>
              <td className="py-2 border text-center">{item.weeks_won}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OverallRanking;
