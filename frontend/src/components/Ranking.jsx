import React, { useEffect, useState } from 'react';

const Ranking = () => {
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/ranking/")
      .then(res => res.json())
      .then(data => setRanking(data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Ranking</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 border-b">Posição</th>
            <th className="py-2 border-b">Usuário</th>
            <th className="py-2 border-b">Pontos</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((user, index) => (
            <tr key={user.id}>
              <td className="py-2 text-center border-b">{index + 1}</td>
              <td className="py-2 text-center border-b">{user.username}</td>
              <td className="py-2 text-center border-b">{user.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Ranking;
