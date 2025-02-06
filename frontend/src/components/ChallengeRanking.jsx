// ChallengeRanking.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ChallengeRanking = () => {
  const { challengeId } = useParams();
  const [participants, setParticipants] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${API_URL}/challenges/${challengeId}/ranking`)
      .then((res) => res.json())
      .then((data) => setParticipants(data))
      .catch((err) => console.error(err));
  }, [API_URL, challengeId]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Ranking do Desafio</h1>
      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th className="py-2 border">Posição</th>
            <th className="py-2 border">Usuário</th>
            <th className="py-2 border">Imagem</th>
            <th className="py-2 border">Progresso</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p, index) => (
            <tr key={p.id}>
              <td className="py-2 border text-center">{index + 1}</td>
              <td className="py-2 border text-center">{p.user.username}</td>
              <td className="py-2 border text-center">
                {p.user.profile_image ? (
                  <img
                    src={p.user.profile_image}
                    alt={p.user.username}
                    className="h-10 w-10 rounded-full mx-auto object-cover"
                  />
                ) : (
                  "Sem imagem"
                )}
              </td>
              <td className="py-2 border text-center">{p.progress}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ChallengeRanking;
