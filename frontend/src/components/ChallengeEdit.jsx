import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ChallengeEdit = ({ user }) => {
  const { challengeId } = useParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [modality, setModality] = useState("academia");
  const [target, setTarget] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [endDate, setEndDate] = useState("");
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/challenges/${challengeId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title);
        setDescription(data.description);
        setModality(data.modality);
        setTarget(data.target);
        setStartDate(data.start_date.split("T")[0]);
        setDurationDays(data.duration_days);
        setEndDate(data.end_date.split("T")[0]);
      })
      .catch((err) => console.error(err));
  }, [API_URL, challengeId, user.token]);

  // Atualiza endDate se startDate e durationDays mudarem
  useEffect(() => {
    if (startDate && durationDays) {
      const start = new Date(startDate);
      const calcEnd = new Date(start.getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000);
      setEndDate(calcEnd.toISOString().split("T")[0]);
    }
  }, [startDate, durationDays]);

  // Atualiza durationDays se startDate e endDate mudarem
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1;
      setDurationDays(diffDays);
    }
  }, [startDate, endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title,
      description,
      modality,
      target: parseInt(target),
      start_date: new Date(startDate).toISOString(),
      duration_days: parseInt(durationDays),
      end_date: new Date(endDate).toISOString(),
    };
    try {
      const res = await fetch(`${API_URL}/challenges/${challengeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("Desafio atualizado com sucesso!");
        navigate(`/challenges/${challengeId}`);
      } else {
        const errData = await res.json();
        console.error("Erro ao atualizar desafio:", errData);
        alert("Erro ao atualizar desafio.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro na atualização do desafio.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editar Desafio</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700">Título:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Descrição:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
          ></textarea>
        </div>
        <div>
          <label className="block text-gray-700">Modalidade:</label>
          <select
            value={modality}
            onChange={(e) => setModality(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="academia">Academia</option>
            <option value="corrida">Corrida</option>
            <option value="calorias">Calorias queimadas</option>
            <option value="passos">Passos dados</option>
            <option value="artes marciais">Artes marciais</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700">Meta:</label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Data de início:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Quantidade de dias:</label>
          <input
            type="number"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Data de término:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Atualizar Desafio
        </button>
      </form>
    </div>
  );
};

export default ChallengeEdit;
