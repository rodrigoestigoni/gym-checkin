import React, { useEffect, useState } from "react";

const Ranking = () => {
  const [ranking, setRanking] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${API_URL}/ranking/`)
      .then((res) => res.json())
      .then(setRanking)
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Ranking</h1>
      <table className="min-w-full bg-white dark:bg-gray-800 shadow rounded">
        <thead>
          <tr>
            <th className="py-2 border">Posição</th>
            <th className="py-2 border">Usuário</th>
            <th className="py-2 border">Imagem</th>
            <th className="py-2 border">Pontos</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((u, index) => (
            <tr key={u.id}>
              <td className="py-2 border text-center">{index + 1}</td>
              <td className="py-2 border text-center">{u.username}</td>
              <td className="py-2 border text-center">
                {u.profile_image ? (
                  <img src={u.profile_image} alt="perfil" className="h-10 w-10 rounded-full mx-auto" />
                ) : (
                  <span className="text-gray-500">Sem imagem</span>
                )}
              </td>
              <td className="py-2 border text-center">{u.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Ranking;
