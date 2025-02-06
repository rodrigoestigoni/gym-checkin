import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ChallengeInvitations = ({ user }) => {
  const { challengeId } = useParams();
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
        .then((res) => res.json())
        .then(setPending)
        .catch((err) => console.error(err));
    }
  }, [API_URL, challengeId, user.token]);

  const handleApprove = async (participantId) => {
    try {
      const res = await fetch(`${API_URL}/challenges/${challengeId}/approve?participant_id=${participantId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (res.ok) {
        setPending(pending.filter((p) => p.id !== participantId));
      } else {
        alert("Erro ao aprovar o participante");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Participantes Pendentes</h2>
      {pending.length === 0 ? (
        <p>Nenhum convite pendente.</p>
      ) : (
        <ul>
          {pending.map((p) => (
            <li key={p.id} className="border p-2 mb-2 flex justify-between items-center">
              <span>{p.user.username} (ID: {p.id})</span>
              <button
                onClick={() => handleApprove(p.id)}
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
