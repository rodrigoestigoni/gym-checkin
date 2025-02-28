// frontend/src/components/ChallengeInvite.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faSpinner } from "@fortawesome/free-solid-svg-icons";

const ChallengeInvite = ({ user }) => {
  const [inviteCode, setInviteCode] = useState("");
  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState("");
  const [participantStatus, setParticipantStatus] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
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
        setError(errData.detail || "Desafio não encontrado");
        setChallenge(null);
      }
    } catch (err) {
      console.error(err);
      setError("Erro na requisição");
      setChallenge(null);
    }
  };

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
          return null;
        })
        .then((data) => setParticipantStatus(data))
        .catch((err) => console.error("Erro ao buscar participant-status:", err));
    }
  }, [challenge, user.token, API_URL]);

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
        const statusRes = await fetch(`${API_URL}/challenges/${challenge.id}/participant-status`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (statusRes.ok) {
          setParticipantStatus(await statusRes.json());
        }
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
      <form onSubmit={handleSearch} className="mb-4 flex">
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="Digite o código (ex: RHRPTU)"
          className="flex-1 p-2 border rounded-l"
          required
        />
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded-r hover:bg-green-600"
        >
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </form>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {challenge && (
        <div className="border p-4 rounded shadow">
          <h2 className="text-xl font-bold">{challenge.title}</h2>
          <p>{challenge.description}</p>
          <p>
            Modalidade: <strong>{challenge.modality}</strong> | Meta: <strong>{challenge.target}</strong>
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
            participantStatus.approved ? (
              <p className="text-green-600 font-semibold mt-2">Você já está participando!</p>
            ) : (
              <p className="text-yellow-600 font-semibold mt-2">Aguardando aprovação</p>
            )
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