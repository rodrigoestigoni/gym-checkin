import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ShareChallenge from "./ShareChallenge";

const ChallengeDetail = ({ user }) => {
  const { challengeId } = useParams();
  const [challenge, setChallenge] = useState(null);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${API_URL}/challenges/${challengeId}`)
      .then((res) => res.json())
      .then(setChallenge)
      .catch((err) => console.error(err));
  }, [API_URL, challengeId]);

  const handleJoin = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/challenges/${challengeId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (res.ok) {
        alert("Você entrou no desafio com sucesso!");
      } else {
        alert("Erro ao entrar no desafio.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!challenge) return <div>Carregando...</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{challenge.title}</h1>
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
      <div className="flex space-x-4 mt-4">
        <button
          onClick={handleJoin}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Participar do Desafio
        </button>
        <ShareChallenge challengeId={challenge.id} />
      </div>
    </div>
  );
};

export default ChallengeDetail;
