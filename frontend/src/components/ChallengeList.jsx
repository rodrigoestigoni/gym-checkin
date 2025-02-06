import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import ChallengeDetailModal from "./ChallengeDetailModal";

const ChallengeList = ({ user }) => {
  const [challenges, setChallenges] = useState([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (user && user.token) {
      fetch(`${API_URL}/challenges/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((res) => res.json())
        .then(setChallenges)
        .catch((err) => console.error("Erro ao carregar desafios:", err));
    }
  }, [API_URL, user]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Desafios Disponíveis</h1>
      <ul className="space-y-4">
        {challenges.map((challenge) => (
          <li key={challenge.id} className="border p-4 rounded">
            <h2 className="text-xl font-bold">
              {challenge.title} <span className="text-sm text-gray-500">(ID: {challenge.code})</span>
            </h2>
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
            <button
              onClick={() => setSelectedChallengeId(challenge.id)}
              className="text-blue-500 hover:underline"
            >
              Ver Detalhes
            </button>
          </li>
        ))}
      </ul>
      {selectedChallengeId && (
        <Modal isOpen={true} onClose={() => setSelectedChallengeId(null)}>
          <ChallengeDetailModal 
            challengeId={selectedChallengeId} 
            user={user} 
            onClose={() => setSelectedChallengeId(null)}
            onDeleteSuccess={() => {
              // Após exclusão, atualize a lista:
              setChallenges(challenges.filter(ch => ch.id !== selectedChallengeId));
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default ChallengeList;
