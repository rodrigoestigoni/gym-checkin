// frontend/src/components/ChallengeDetailByCode.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ChallengeDetailByCode = ({ user }) => {
  const { code } = useParams();  // Espera-se que a rota seja /challenge/:code
  const [challenge, setChallenge] = useState(null);
  const [participant, setParticipant] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const navigate = useNavigate();

  useEffect(() => {
    if (!code) return;
    // Busca o desafio pelo código
    fetch(`${API_URL}/challenges/invite/${code}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setChallenge(data))
      .catch((err) => console.error(err));
  }, [API_URL, code, user.token]);

  useEffect(() => {
    if (challenge && challenge.id) {
      fetch(`${API_URL}/challenges/${challenge.id}/participant-status`, {
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
    }
  }, [API_URL, challenge, user.token]);

  if (!challenge) return <div>Carregando desafio...</div>;

  const handleJoin = () => {
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
          setParticipant(true);
        } else {
          alert("Erro ao solicitar participação");
        }
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">
        {challenge.title} <span className="text-sm text-gray-500">(Código: {challenge.code})</span>
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
      {challenge.bet && (
        <p>
          <strong>Regras / Aposta:</strong> {challenge.bet}
        </p>
      )}
      <div className="mt-4">
        {participant ? (
          <button
            disabled
            className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
          >
            Aguardando aprovação
          </button>
        ) : (
          <button
            onClick={handleJoin}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Solicitar Participação
          </button>
        )}
      </div>
    </div>
  );
};

export default ChallengeDetailByCode;
