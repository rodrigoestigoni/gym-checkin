// frontend/src/components/ChallengeList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ChallengeList = ({ user }) => {
  const [challenges, setChallenges] = useState([]);
  const [challengesWithCount, setChallengesWithCount] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const navigate = useNavigate();

  // Busca os desafios criados pelo usuário
  useEffect(() => {
    fetch(`${API_URL}/challenges/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`
      }
    })
      .then(res => res.json())
      .then(data => setChallenges(data))
      .catch(err => console.error(err));
  }, [API_URL, user.token]);

  // Função para buscar a contagem de participantes para um desafio
  const getParticipantCount = async (challengeId) => {
    try {
      const res = await fetch(`${API_URL}/challenges/${challengeId}/participants/count`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`
        }
      });
      const data = await res.json();
      return data.count;
    } catch (err) {
      console.error(err);
      return 0;
    }
  };

  // Para cada desafio, busque a contagem e armazene em challengesWithCount
  useEffect(() => {
    const loadCounts = async () => {
      const updated = await Promise.all(
        challenges.map(async (ch) => {
          const count = await getParticipantCount(ch.id);
          return { ...ch, participantCount: count };
        })
      );
      setChallengesWithCount(updated);
    };
    if(challenges.length > 0) {
      loadCounts();
    }
  }, [challenges]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Meus desafios</h2>
      {challengesWithCount.length === 0 ? (
        <p>Nenhum desafio criado.</p>
      ) : (
        <div className="space-y-4">
          {challengesWithCount.map(ch => (
            <div key={ch.id} className="border p-4 rounded shadow flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl">{ch.title}</h3>
                <p className="text-sm text-gray-600">Código: {ch.code}</p>
                <p className="mt-1">Participantes: {ch.participantCount}</p>
              </div>
              <button
                onClick={() => navigate(`/challenges/${ch.id}`)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Ver detalhes
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChallengeList;
