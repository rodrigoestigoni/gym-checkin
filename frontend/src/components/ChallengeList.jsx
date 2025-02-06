import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const ChallengeList = () => {
  const [challenges, setChallenges] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${API_URL}/challenges/`)
      .then((res) => res.json())
      .then(setChallenges)
      .catch((err) => console.error(err));
  }, [API_URL]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Desafios Disponíveis</h1>
      <ul className="space-y-4">
        {challenges.map((challenge) => (
          <li key={challenge.id} className="border p-4 rounded">
            <h2 className="text-xl font-bold">{challenge.title}</h2>
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
            <Link
              to={`/challenges/${challenge.id}`}
              className="text-blue-500 hover:underline"
            >
              Ver Detalhes
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChallengeList;
