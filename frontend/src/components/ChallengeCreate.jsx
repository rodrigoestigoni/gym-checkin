// frontend/src/components/ChallengeCreate.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ChallengeCreate = ({ user }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [modality, setModality] = useState("academia");
  const [target, setTarget] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bet, setBet] = useState("");  // Estado para as regras/aposta
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const navigate = useNavigate();

  // Atualiza endDate se startDate e durationDays mudarem
  useEffect(() => {
    if (startDate && durationDays) {
      const start = new Date(startDate);
      const calculatedEnd = new Date(start.getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000);
      setEndDate(calculatedEnd.toISOString().split("T")[0]);
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
    if (!user) {
      navigate("/login");
      return;
    }
    const payload = {
      title,
      description,
      modality,
      target: parseInt(target),
      start_date: new Date(startDate).toISOString(),
      duration_days: parseInt(durationDays),
      end_date: new Date(endDate).toISOString(),
      bet,  // Envia o campo de regras/aposta
    };
    try {
      const res = await fetch(`${API_URL}/challenges/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("Desafio criado com sucesso!");
        navigate("/challenges");
      } else {
        const errorData = await res.json();
        console.error("Erro ao criar desafio:", errorData);
        alert("Erro ao criar desafio.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro na criação do desafio.");
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Criar Desafio</h1>
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
          <label className="block text-gray-700">Meta (quantidade):</label>
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
        <div>
          <label className="block text-gray-700">Regras / Aposta:</label>
          <textarea
            value={bet}
            onChange={(e) => setBet(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Digite as regras, apostas, etc."
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Criar Desafio
        </button>
      </form>
    </div>
  );
};

export default ChallengeCreate;
