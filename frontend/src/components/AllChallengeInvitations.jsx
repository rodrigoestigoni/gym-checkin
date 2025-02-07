// frontend/src/components/AllChallengeInvitations.jsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTrash } from '@fortawesome/free-solid-svg-icons';

const AllChallengeInvitations = ({ user }) => {
  const [invitations, setInvitations] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    console.log("Buscando convites para os desafios criados pelo usuário:", user.id);
    fetch(`${API_URL}/challenge-invitations/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => {
        console.log("Response status (/challenge-invitations):", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("Convites retornados:", data);
        setInvitations(data);
      })
      .catch((err) => console.error("Erro ao buscar convites:", err));
  }, [API_URL, user.token]);

  const handleApprove = (participantId, challengeId) => {
    fetch(`${API_URL}/challenges/${challengeId}/approve?participant_id=${participantId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => {
        if (res.ok) {
          alert("Convite aprovado.");
          setInvitations(invitations.filter((inv) => inv.participant.id !== participantId));
        } else {
          alert("Erro ao aprovar convite.");
        }
      })
      .catch((err) => console.error(err));
  };

  const handleDelete = (invitationId, participantId) => {
    if (window.confirm("Tem certeza que deseja excluir esse convite?")) {
      fetch(`${API_URL}/challenge-participants/${invitationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((res) => {
          if (res.ok) {
            alert("Convite excluído.");
            setInvitations(invitations.filter((inv) => inv.participant.id !== participantId));
          } else {
            alert("Erro ao excluir convite.");
          }
        })
        .catch((err) => console.error(err));
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Convites Pendentes</h2>
      {invitations.length === 0 ? (
        <p>Nenhum convite pendente.</p>
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => (
            <div key={inv.participant.id} className="border p-4 rounded shadow">
              {/* Cabeçalho com título e código do desafio */}
              <div className="mb-2">
                <h3 className="font-bold text-lg">
                  {inv.challenge.title}{" "}
                  <span className="text-sm text-gray-500">(Código: {inv.challenge.code})</span>
                </h3>
              </div>
              {/* Linha com informações do participante */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={inv.participant.profile_image || "/placeholder.png"}
                    alt={inv.participant.username || "Sem foto"}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <span className="ml-2 font-semibold">
                    {inv.participant.username ? inv.participant.username : `User ${inv.participant.user_id}`}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      handleApprove(inv.participant.id, inv.challenge.id)
                    }
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center"
                    title="Aprovar"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-1" /> 
                  </button>
                  <button
                    onClick={() => handleDelete(inv.participant.id, inv.participant.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center"
                    title="Excluir"
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-1" /> 
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllChallengeInvitations;
