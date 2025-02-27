// frontend/src/components/ChallengeCheckinForm.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";

const ChallengeCheckinForm = ({ user }) => {
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (user) {
      fetch(`${API_URL}/challenge-participation/`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          const approvedChallenges = data.filter((p) => p.participant.approved);
          // Filtra desafios que já iniciaram
          const now = new Date();
          const activeChallenges = approvedChallenges.filter(
            (p) => new Date(p.challenge.start_date) <= now
          );
          setChallenges(activeChallenges);

          // Pré-seleciona o desafio se vier da URL
          const urlParams = new URLSearchParams(window.location.search);
          const challengeId = urlParams.get("challengeId");
          if (challengeId && activeChallenges.find((c) => c.challenge.id === parseInt(challengeId))) {
            setSelectedChallenge(challengeId);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [user, API_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChallenge) {
      setMsg({ text: "Selecione um desafio.", type: "error" });
      return;
    }
    const payload = {
      user_id: user.id,
      duration: duration ? parseFloat(duration) : null,
      description: description || null,
      ...(date && { timestamp: new Date(date).toISOString() }),
    };
    try {
      const res = await fetch(`${API_URL}/challenges/${selectedChallenge}/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMsg({ text: "Check-in realizado com sucesso!", type: "success" });
        setDuration("");
        setDescription("");
        setDate("");
      } else {
        setMsg({ text: "Erro ao realizar check-in.", type: "error" });
      }
    } catch (error) {
      console.error(error);
      setMsg({ text: "Erro de conexão.", type: "error" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <FontAwesomeIcon icon={faCheckCircle} className="mr-2 text-green-500" />
        Check-in em Desafio
      </h2>
      {msg.text && (
        <div className={`mb-4 p-2 rounded ${msg.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {msg.text}
        </div>
      )}
      <div className="mb-4">
        <label className="block text-gray-700">Desafio</label>
        <select
          value={selectedChallenge}
          onChange={(e) => setSelectedChallenge(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Selecione um desafio</option>
          {challenges.map((c) => (
            <option key={c.challenge.id} value={c.challenge.id}>
              {c.challenge.title}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Tempo do treino (minutos)</label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Descrição</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Data do Check-in</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
        Confirmar Check-in
      </button>
    </form>
  );
};

export default ChallengeCheckinForm;