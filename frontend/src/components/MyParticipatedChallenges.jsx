// frontend/src/components/MyParticipatedChallenges.jsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const MyParticipatedChallenges = ({ user }) => {
  const [participations, setParticipations] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    console.log("Buscando desafios participados para o usuário:", user.id);
    fetch(`${API_URL}/challenge-participation/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => {
        console.log("Response status (challenge-participation):", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("Participações retornadas:", data);
        setParticipations(data);
      })
      .catch((err) => console.error("Erro ao buscar desafios participados:", err));
  }, [API_URL, user.token]);

  const handleCancelParticipation = (participantId) => {
    if (window.confirm("Deseja cancelar sua participação?")) {
      fetch(`${API_URL}/challenge-participants/${participantId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((res) => {
          if (res.ok) {
            alert("Participação cancelada.");
            setParticipations(
              participations.filter((p) => p.participant.id !== participantId)
            );
          } else {
            alert("Erro ao cancelar participação.");
          }
        })
        .catch((err) => console.error("Erro ao cancelar participação:", err));
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Minhas Participações</h2>
      {participations.length === 0 ? (
        <p>Nenhum desafio solicitado.</p>
      ) : (
        <div className="space-y-4">
          {participations.map((item) => {
            const { challenge, participant } = item;
            return (
              <div
                key={challenge.id}
                className="border p-4 rounded shadow flex items-center"
              >
                {/* Coluna da esquerda: Avatar do criador */}
                <div className="mr-4">
                  <img
                    src={challenge.creator?.profile_image || "/placeholder.png"}
                    alt={challenge.creator?.username || "Sem foto"}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                </div>
                {/* Coluna da direita: Informações do desafio */}
                <div className="flex-1">
                  <h3 className="font-bold text-xl">{challenge.title}</h3>
                  <p className="text-sm text-gray-600">Código: {challenge.code}</p>
                  {!participant.approved ? (
                    <p className="mt-1 text-yellow-600 font-semibold">Aguardando aprovação</p>
                  ) : (
                    <p className="mt-1 text-green-600 font-semibold">Participando</p>
                  )}
                </div>
                {/* Botão para cancelar participação (sempre disponível para cancelar) */}
                <div className="ml-4">
                  <button
                    onClick={() => handleCancelParticipation(participant.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center"
                  >
                    <FontAwesomeIcon icon={faTimes} className="mr-1" /> Sair
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyParticipatedChallenges;
