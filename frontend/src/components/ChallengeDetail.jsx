import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ShareChallenge from "./ShareChallenge";

const ChallengeDetail = ({ user }) => {
  const { challengeId } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
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
        // Se o usuário não tiver solicitado, o endpoint pode retornar 404 ou um objeto com status "pending"
        if (res.status === 200) return res.json();
        else return null;
      })
      .then((data) => {
        if (data) setAlreadyJoined(true);
      })
      .catch((err) => console.error(err));
  }, [API_URL, challengeId, user.token]);

  if (!challenge) return <div>Carregando...</div>;

  // Permite editar/excluir somente se o desafio ainda não começou e o usuário é o criador
  const canEdit = (new Date(challenge.start_date) > new Date()) && (challenge.created_by === user.id);

  return (
    <div className="p-4 max-w-4xl mx-auto">
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
      <div className="flex space-x-4 mt-4">
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
                        navigate("/challenges");
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
        {/* Se o usuário não for o criador, mostrar opção de participar */}
        {challenge.created_by !== user.id && (
          <>
            {alreadyJoined ? (
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
                      if (res.ok) {
                        alert("Solicitação enviada! Aguarde aprovação.");
                        setAlreadyJoined(true);
                      } else {
                        alert("Erro ao solicitar participação");
                      }
                    })
                    .catch((err) => console.error(err));
                }}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Solicitar Participação
              </button>
            )}
          </>
        )}
        <ShareChallenge challengeId={challenge.id} />
      </div>
      {/* Opcional: incluir abas internas (detalhes, ranking, etc.) dentro da página de desafio */}
    </div>
  );
};

export default ChallengeDetail;
