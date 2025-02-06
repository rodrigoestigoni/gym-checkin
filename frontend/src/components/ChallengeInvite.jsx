import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ChallengeInvite = ({ user }) => {
  const [inviteCode, setInviteCode] = useState("");
  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState("");
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
        setChallenge(null);
        setInviteCode("");
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
          <button
            onClick={handleJoin}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mt-2"
          >
            Solicitar Participação
          </button>
        </div>
      )}
    </div>
  );
};

export default ChallengeInvite;
