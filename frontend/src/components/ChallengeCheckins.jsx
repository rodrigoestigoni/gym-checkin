// src/components/ChallengeCheckins.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { useChallenge } from '../contexts/ChallengeContext';
import { api } from '../services/api';

const ChallengeCheckins = ({ user }) => {
  const { challengeId } = useParams();
  const { activeChallenge } = useChallenge();
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      user_id: user.id,
      duration: duration ? parseFloat(duration) : null,
      description: description || null,
      ...(date && { timestamp: new Date(date).toISOString() }),
    };

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:8000"}/challenges/${challengeId}/checkin`, {
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
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FontAwesomeIcon icon={faCheckCircle} className="mr-2 text-green-500" />
          Check-in: {activeChallenge?.title}
        </h2>

        {msg.text && (
          <div
            className={`mb-4 p-2 rounded ${
              msg.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300">
            Duração (minutos) <span className="text-sm text-gray-400">(opcional)</span>
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300">
            Descrição <span className="text-sm text-gray-400">(opcional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            rows="3"
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300">
            Data <span className="text-sm text-gray-400">(se não marcado, usa a data atual)</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Confirmar Check-in
        </button>
      </form>
    </div>
  );
};

export default ChallengeCheckins;