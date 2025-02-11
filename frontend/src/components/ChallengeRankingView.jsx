// frontend/src/components/ChallengeRankingView.jsx
import React, { useEffect, useState } from "react";
import ChallengeRanking from "./ChallengeRanking";

const ChallengeRankingView = ({ user }) => {
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [myChallenges, setMyChallenges] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    // Busca desafios criados por mim e os que participo
    Promise.all([
      fetch(`${API_URL}/challenges/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      }).then((res) => res.json()),
      fetch(`${API_URL}/challenge-participation/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      }).then((res) => res.json()),
    ])
      .then(([created, participated]) => {
        // Combine os desafios (evitando duplicatas)
        const combined = [...created];
        participated.forEach((item) => {
          if (!combined.find((ch) => ch.id === item.challenge.id)) {
            combined.push(item.challenge);
          }
        });
        setMyChallenges(combined);
        if (combined.length > 0) {
          setSelectedChallenge(combined[0]);
        }
      })
      .catch((err) => console.error(err));
  }, [API_URL, user.token]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Selecione um Desafio</h2>
      <select
        className="w-full p-2 border rounded mb-4"
        value={selectedChallenge ? selectedChallenge.id : ""}
        onChange={(e) =>
          setSelectedChallenge(
            myChallenges.find((ch) => ch.id === parseInt(e.target.value))
          )
        }
      >
        {myChallenges.map((ch) => (
          <option key={ch.id} value={ch.id}>
            {ch.title} – {new Date(ch.start_date).toLocaleDateString()} a{" "}
            {new Date(ch.end_date).toLocaleDateString()}
          </option>
        ))}
      </select>
      {selectedChallenge && (
        <ChallengeRanking challengeId={selectedChallenge.id} user={user} />
      )}
    </div>
  );
};

export default ChallengeRankingView;
