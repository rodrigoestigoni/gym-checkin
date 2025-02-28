// frontend/src/components/AllChallengeInvitations.jsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCheck, faUserTimes } from "@fortawesome/free-solid-svg-icons";

const AllChallengeInvitations = ({ user }) => {
  const [invitations, setInvitations] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchInvitations();
  }, [user]);

  const fetchInvitations = () => {
    fetch(`${API_URL}/challenge-invitations/`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Dados recebidos do backend:", data); // Adiciona log para debug
        setInvitations(data);
      })
      .catch((err) => console.error(err));
  };

  const handleApprove = async (challengeId, participantId) => {
    try {
      const res = await fetch(`${API_URL}/challenges/${challengeId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ participant_id: participantId }),
      });
      if (res.ok) {
        alert("Participante aprovado!");
        setInvitations(invitations.filter((inv) => inv.participant.id !== participantId));
      } else {
        alert("Erro ao aprovar participante.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeny = async (participantId) => {
    if (window.confirm("Deseja rejeitar esta solicitação?")) {
      try {
        const res = await fetch(`${API_URL}/challenge-participants/${participantId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        if (res.ok) {
          alert("Solicitação rejeitada!");
          setInvitations(invitations.filter((inv) => inv.participant.id !== participantId));
        } else {
          alert("Erro ao rejeitar solicitação.");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Aprovar Convites</h2>
      {invitations.length === 0 ? (
        <p>Nenhum convite pendente.</p>
      ) : (
        <div className="space-y-4">
          {invitations.map((item) => {
            const { challenge, participant } = item;
            return (
              <div key={participant.id} className="border p-4 rounded shadow flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={participant.user?.profile_image || "/placeholder.png"}
                    alt={participant.user?.username || "Usuário Desconhecido"}
                    className="h-12 w-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h3 className="font-bold text-xl">{challenge.title}</h3>
                    <p className="text-sm text-gray-600">
                      Solicitado por: {participant.user?.username || "Usuário Desconhecido"} (ID: {participant.user_id})
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApprove(challenge.id, participant.id)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center"
                  >
                    <FontAwesomeIcon icon={faUserCheck} className="mr-1" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleDeny(participant.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center"
                  >
                    <FontAwesomeIcon icon={faUserTimes} className="mr-1" />
                    Rejeitar
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

export default AllChallengeInvitations;