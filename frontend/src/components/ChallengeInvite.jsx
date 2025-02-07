// frontend/src/components/ChallengeInvite.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ChallengeInvite = ({ user }) => {
  const [inviteCode, setInviteCode] = useState("");
  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState("");
  const [participantStatus, setParticipantStatus] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/challenges/invite/${inviteCode}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setChallenge(data);
        setError("");
      } else {
        const errData = await res.json();
        setError(errData.detail || "Erro ao buscar desafio");
        setChallenge(null);
      }
    } catch (err) {
      console.error(err);
      setError("Erro na requisição");
      setChallenge(null);
    }
  };

  // Assim que um desafio for encontrado, busque o status de participação
  useEffect(() => {
    if (challenge && challenge.id) {
      fetch(`${API_URL}/challenges/${challenge.id}/participant-status`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((res) => {
          // Use um log para debugar
          console.log("Response status from participant-status:", res.status);
          if (res.ok) return res.json();
          else return null;
        })
        .then((data) => {
          console.log("Dados de participant-status:", data);
          setParticipantStatus(data);
        })
        .catch((err) =>
          console.error("Erro ao buscar participant-status:", err)
        );
    }
  }, [API_URL, challenge, user.token]);

  const handleJoin = async () => {
    if (!challenge) return;
    try {
      const res = await fetch(`${API_URL}/challenges/${challenge.id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (res.ok) {
        alert("Solicitação enviada! Aguarde aprovação.");
        setParticipantStatus(true);
      } else {
        alert("Erro ao solicitar participação");
      }
    } catch (err) {
      console.error(err);
      alert("Erro na requisição");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Buscar Desafio por Código</h1>
      <form onSubmit={handleSearch} className="mb-4">
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="Digite o código (ex: RHRPTU)"
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-green-500 text-white p-2 rounded mt-2 hover:bg-green-600"
        >
          Buscar
        </button>
      </form>
      {error && <p className="text-red-500">{error}</p>}
      {challenge && (
        <div className="border p-4 rounded">
          <h2 className="text-xl font-bold">{challenge.title}</h2>
          <p>{challenge.description}</p>
          <p>
            Modalidade: <strong>{challenge.modality}</strong> | Meta:{" "}
            <strong>{challenge.target}</strong>
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
          {participantStatus ? (
            <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded">
              Aguardando aprovação
            </div>
          ) : (
            <button
              onClick={handleJoin}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mt-2"
            >
              Solicitar Participação
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChallengeInvite;
