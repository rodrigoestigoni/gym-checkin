// frontend/src/components/ChallengeInvitations.jsx
import React, { useEffect, useState } from "react";

const ChallengeInvitations = ({ challengeId, user }) => {
  const [pending, setPending] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (challengeId) {
      fetch(`${API_URL}/challenges/${challengeId}/pending`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((res) => {
          console.log("Response status from /pending:", res.status);
          return res.json();
        })
        .then((data) => {
          console.log("Dados pendentes recebidos:", data);
          setPending(data);
        })
        .catch((err) => console.error(err));
    }
  }, [API_URL, challengeId, user.token]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Participantes Pendentes</h2>
      {pending.length === 0 ? (
        <p>Nenhum convite pendente.</p>
      ) : (
        <ul>
          {pending.map((p) => (
            <li
              key={p.id}
              className="border p-2 mb-2 flex justify-between items-center"
            >
              <span>ID: {p.id} - User ID: {p.user_id}</span>
              <button
                onClick={() => {
                  // Aqui você pode implementar a função de aprovação
                  alert(`Aprovar o participante com ID: ${p.id}`);
                }}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                Aprovar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChallengeInvitations;
