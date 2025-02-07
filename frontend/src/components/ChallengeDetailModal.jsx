import React, { useEffect, useState } from "react";
import ShareChallenge from "./ShareChallenge";
import { useNavigate } from "react-router-dom";

const ChallengeDetailModal = ({ challengeId, user, onClose, onDeleteSuccess }) => {
  const [challenge, setChallenge] = useState(null);
  const [participant, setParticipant] = useState(null);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (!challengeId) return;
    // Buscar os detalhes do desafio
    fetch(`${API_URL}/challenges/${challengeId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => res.json())
      .then(setChallenge)
      .catch((err) => console.error(err));

    // Verificar se o usuário já solicitou participação
    fetch(`${API_URL}/challenges/${challengeId}/participant-status`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => {
        if (res.ok) return res.json();
        else return null;
      })
      .then((data) => {
        if (data) setParticipant(data);
      })
      .catch((err) => console.error(err));
  }, [API_URL, challengeId, user.token]);

  if (!challenge) return <div>Carregando...</div>;

  const canEdit = (new Date(challenge.start_date) > new Date()) && (challenge.created_by === user.id);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-center">
        {challenge.title} <span className="text-sm text-gray-500">(ID: {challenge.code})</span>
      </h1>
      <p>{challenge.description}</p>
      <p>
        Modalidade: <strong>{challenge.modality}</strong> | Meta:{" "}
        <strong>{challenge.target}</strong>{" "}
        {challenge.modality === "academia" ? "treinos" : ""}
      </p>
      <p>
        Período: {new Date(challenge.start_date).toLocaleDateString()} -{" "}
        {new Date(challenge.end_date).toLocaleDateString()}
      </p>
      <p>
        Aposta: <strong>{challenge.bet || "Nenhuma aposta definida"}</strong>
      </p>
      <div className="flex flex-wrap justify-center space-x-4 mt-4">
        {canEdit && (
          <>
            <button
              onClick={() => navigate(`/challenges/${challenge.id}/edit`)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Editar Desafio
            </button>
            <button
              onClick={() => {
                if (window.confirm("Tem certeza que deseja excluir este desafio?")) {
                  fetch(`${API_URL}/challenges/${challenge.id}`, {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${user.token}`,
                    },
                  })
                    .then((res) => {
                      if (res.ok) {
                        alert("Desafio excluído com sucesso");
                        onDeleteSuccess();
                        onClose();
                      } else {
                        alert("Erro ao excluir desafio");
                      }
                    })
                    .catch((err) => console.error(err));
                }
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Excluir Desafio
            </button>
          </>
        )}
        {challenge.created_by !== user.id && (
          <>
            {participant ? (
              <button
                disabled
                className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
              >
                Aguardando aprovação
              </button>
            ) : (
              <button
                onClick={() => {
                  fetch(`${API_URL}/challenges/${challenge.id}/join`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${user.token}`,
                    },
                  })
                    .then((res) => {
                      if (res.ok) return res.json();
                      else throw new Error("Erro ao solicitar participação");
                    })
                    .then((data) => {
                      setParticipant(data);
                      alert("Solicitação enviada! Aguarde aprovação.");
                    })
                    .catch((err) => {
                      console.error(err);
                      alert("Erro ao solicitar participação");
                    });
                }}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Solicitar Participação
              </button>
            )}
          </>
        )}
        <ShareChallenge challengeCode={challenge.code} user={user} />
      </div>
    </div>
  );
};

export default ChallengeDetailModal;
