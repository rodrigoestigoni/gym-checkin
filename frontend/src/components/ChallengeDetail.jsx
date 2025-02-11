// frontend/src/components/ChallengeDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

const ChallengeDetail = ({ user }) => {
  const { challengeId } = useParams();
  const [challengeData, setChallengeData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    // Buscar os detalhes do desafio (incluindo o criador)
    fetch(`${API_URL}/challenges/${challengeId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setChallengeData(data))
      .catch((err) => console.error("Erro ao buscar detalhes do desafio:", err));
  }, [API_URL, challengeId, user.token]);

  useEffect(() => {
    // Buscar os registros de participação aprovados (com dados do usuário)
    fetch(`${API_URL}/challenges/${challengeId}/participants`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Participantes retornados:", data);
        setParticipants(data);
      })
      .catch((err) => console.error("Erro ao buscar participantes:", err));
  }, [API_URL, challengeId, user.token]);

  const handleRemoveParticipant = (participantId) => {
    if (window.confirm("Tem certeza que deseja remover este participante?")) {
      fetch(`${API_URL}/challenge-participants/${participantId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((res) => {
          if (res.ok) {
            alert("Participante removido.");
            setParticipants(participants.filter((p) => p.id !== participantId));
          } else {
            alert("Erro ao remover participante.");
          }
        })
        .catch((err) => console.error(err));
    }
  };

  if (!challengeData) return <div>Carregando detalhes do desafio...</div>;

  const now = new Date();
  const startDate = new Date(challengeData.start_date);
  const statusText = now >= startDate ? "Em andamento!" : "Aguardando data de início";

  return (
    <>
      <div className="flex justify-center mb-4">
        <button
          onClick={() => navigate(`/challenges/${challengeData.id}/checkin`)}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Fazer Checkin
        </button>
      </div>
      <div className="p-4 max-w-4xl mx-auto">
      {/* Cabeçalho com detalhes do desafio */}
      <div className="border p-4 rounded shadow mb-4">
        <h1 className="text-3xl font-bold mb-2">{challengeData.title}</h1>
        <p className="text-sm text-gray-600">Código: {challengeData.code}</p>
        <p className="mt-2">{challengeData.description}</p>
        <p className="mt-2">
          Período: {new Date(challengeData.start_date).toLocaleDateString()} - {new Date(challengeData.end_date).toLocaleDateString()}
        </p>
        <p className="mt-2 font-semibold">{statusText}</p>
        <p className="mt-2 font-semibold">Participantes: {participants.length}</p>
        {/* Seção para exibir o criador */}
        <div className="mt-4 flex items-center">
          <img
            src={challengeData.creator?.profile_image || "/placeholder.png"}
            alt={challengeData.creator?.username || "Sem foto"}
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="ml-2 font-semibold">Criado por: {challengeData.creator?.username}</span>
        </div>
      </div>
      {/* Lista de participantes */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Participantes</h2>
        {participants.length === 0 ? (
          <p>Nenhum participante.</p>
        ) : (
          <ul className="space-y-2">
            {participants.map((p) => (
              <li key={p.id} className="flex items-center justify-between border p-2 rounded">
                <div className="flex items-center">
                  <img
                    src={p.user.profile_image || "/placeholder.png"}
                    alt={p.user.username || `User ${p.id}`}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <span className="ml-2">{p.user.username || `User ${p.id}`}</span>
                </div>
                {/* Se o usuário logado for o criador, exibir botão para remover */}
                {challengeData.created_by === user.id && (
                  <button
                    onClick={() => handleRemoveParticipant(p.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center"
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-1" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
    
    </>
    
  );
};

export default ChallengeDetail;
