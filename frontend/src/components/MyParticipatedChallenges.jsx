// frontend/src/components/MyParticipatedChallenges.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCheckCircle, faTrophy, faInfoCircle, faListCheck, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import Modal from "./Modal";

const MyParticipatedChallenges = ({ user }) => {
  const [participations, setParticipations] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${API_URL}/challenge-participation/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setParticipations(data))
      .catch((err) => console.error("Erro ao buscar desafios participados:", err));
  }, [API_URL, user.token]);

  const handleCancelParticipation = (participantId) => {
    if (window.confirm("Deseja cancelar sua participação?")) {
      fetch(`${API_URL}/challenge-participants/${participantId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((res) => {
          if (res.ok) {
            alert("Participação cancelada.");
            setParticipations(participations.filter((p) => p.participant.id !== participantId));
          } else {
            alert("Erro ao cancelar participação.");
          }
        })
        .catch((err) => console.error("Erro ao cancelar participação:", err));
    }
  };

  const openDetails = (challenge) => {
    setSelectedChallenge(challenge);
  };

  const closeDetails = () => {
    setSelectedChallenge(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center sm:text-left">Minhas Participações</h2>
      {participations.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400">Nenhum desafio solicitado.</p>
      ) : (
        <div className="space-y-4">
          {participations.map((item) => {
            const { challenge, participant } = item;
            const now = new Date();
            const challengeStarted = new Date(challenge.start_date) <= now;
            return (
              <div
                key={challenge.id}
                className="border p-4 rounded-lg shadow flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 bg-white dark:bg-gray-800"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={challenge.creator?.profile_image || "/placeholder.png"}
                    alt={challenge.creator?.username || "Sem foto"}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-gray-100">{challenge.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Código: {challenge.code}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  {!participant.approved ? (
                    <p className="text-yellow-600 font-semibold">Aguardando aprovação</p>
                  ) : (
                    <div className="flex space-x-2">
                      <Link
                        to={`/challenge/${challenge.id}/ranking`}
                        className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                        title="Ver Ranking"
                      >
                        <FontAwesomeIcon icon={faTrophy} />
                      </Link>
                      <button
                        onClick={() => openDetails(challenge)}
                        className="bg-gray-500 text-white p-2 rounded-full hover:bg-gray-600 transition-colors"
                        title="Ver Detalhes"
                      >
                        <FontAwesomeIcon icon={faInfoCircle} />
                      </button>
                      {challengeStarted && (
                        <Link
                          to={`/challenge-checkin?challengeId=${challenge.id}`}
                          className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
                          title="Fazer Check-in"
                        >
                          <FontAwesomeIcon icon={faListCheck} />
                        </Link>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => handleCancelParticipation(participant.id)}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    title="Sair do Desafio"
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Modal isOpen={!!selectedChallenge} onClose={closeDetails}>
        {selectedChallenge && (
          <div>
            <h3 className="text-xl font-bold mb-2">{selectedChallenge.title}</h3>
            <p><strong>ID do Desafio:</strong> {selectedChallenge.id}</p>
            <p><strong>Código:</strong> {selectedChallenge.code}</p>
            <p><strong>Descrição:</strong> {selectedChallenge.description || "Sem descrição"}</p>
            <p><strong>Modalidade:</strong> {selectedChallenge.modality}</p>
            <p><strong>Meta:</strong> {selectedChallenge.target}</p>
            <p><strong>Início:</strong> {new Date(selectedChallenge.start_date).toLocaleDateString()}</p>
            <p><strong>Duração:</strong> {selectedChallenge.duration_days} dias</p>
            <p><strong>Fim:</strong> {new Date(selectedChallenge.end_date).toLocaleDateString()}</p>
            <p><strong>Regras/Aposta:</strong> {selectedChallenge.bet}</p>
            <p><strong>Privado:</strong> {selectedChallenge.private ? "Sim" : "Não"}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyParticipatedChallenges;