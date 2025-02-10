// frontend/src/components/OverallRanking.jsx
import React, { useEffect, useState } from "react";

const computeOverallRanking = (users, scoreKey) => {
  // Ordena os usuários de forma decrescente pelo score
  const sortedUsers = [...users].sort((a, b) => b[scoreKey] - a[scoreKey]);
  let rankedUsers = [];
  let currentRank = 1;
  if (sortedUsers.length > 0) {
    rankedUsers.push({ ...sortedUsers[0], rank: currentRank });
  }
  for (let i = 1; i < sortedUsers.length; i++) {
    if (sortedUsers[i][scoreKey] < sortedUsers[i - 1][scoreKey]) {
      currentRank++;  // incrementa somente quando o score diminui
    }
    rankedUsers.push({ ...sortedUsers[i], rank: currentRank });
  }
  return rankedUsers;
};


const OverallRanking = () => {
  const [overall, setOverall] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${API_URL}/ranking/overall`)
      .then((res) => res.json())
      .then((data) => {
        if (data.overall) {
          const computed = computeOverallRanking(data.overall, "points");
          setOverall(computed);
        } else {
          setOverall([]);
        }
      })
      .catch((err) => console.error(err));
  }, [API_URL]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Ranking Geral</h1>
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
          {overall.map((u) => (
            <tr key={u.id}>
              <td className="py-2 border text-center">{u.rank}</td>
              <td className="py-2 border text-center">{u.username}</td>
              <td className="py-2 border text-center">
                {u.profile_image ? (
                  <img
                    src={u.profile_image}
                    alt="perfil"
                    className="h-10 w-10 rounded-full mx-auto object-cover"
                  />
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

export default OverallRanking;
