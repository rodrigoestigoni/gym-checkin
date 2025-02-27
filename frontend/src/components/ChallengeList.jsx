// frontend/src/components/ChallengeList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

const ChallengeList = ({ user }) => {
  const [challenges, setChallenges] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${API_URL}/challenges/`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => res.json())
      .then(setChallenges)
      .catch((err) => console.error(err));
  }, [user, API_URL]);

  const handleDelete = async (challengeId) => {
    if (window.confirm("Tem certeza que deseja excluir este desafio?")) {
      try {
        const res = await fetch(`${API_URL}/challenges/${challengeId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (res.ok) {
          setChallenges(challenges.filter((c) => c.id !== challengeId));
        } else {
          alert("Erro ao excluir desafio.");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Meus Desafios</h2>
      {challenges.length === 0 ? (
        <p>Nenhum desafio criado.</p>
      ) : (
        <ul className="space-y-4">
          {challenges.map((c) => {
            const now = new Date();
            const startDate = new Date(c.start_date);
            const canEditOrDelete = startDate > now;
            return (
              <li key={c.id} className="border p-4 rounded shadow">
                <h3 className="font-bold text-xl">{c.title}</h3>
                <p>{c.description}</p>
                <p>Modalidade: {c.modality}</p>
                <p>Meta: {c.target}</p>
                <p>Início: {startDate.toLocaleDateString()}</p>
                <p>Duração: {c.duration_days} dias</p>
                {canEditOrDelete && (
                  <div className="mt-2 flex space-x-2">
                    <Link
                      to={`/challenges/edit/${c.id}`}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 flex items-center"
                    >
                      <FontAwesomeIcon icon={faEdit} className="mr-1" />
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center"
                    >
                      <FontAwesomeIcon icon={faTrash} className="mr-1" />
                      Excluir
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ChallengeList;