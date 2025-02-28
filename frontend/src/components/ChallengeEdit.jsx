// frontend/src/components/ChallengeEdit.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";

const ChallengeEdit = ({ user }) => {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    modality: "",
    target: "",
    start_date: "",
    duration_days: "",
    end_date: "",
    bet: "",
    private: true,
  });
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (user && challengeId) {
      fetch(`${API_URL}/challenges/${challengeId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Erro ao carregar desafio");
          return res.json();
        })
        .then((data) => {
          setFormData({
            title: data.title,
            description: data.description || "",
            modality: data.modality,
            target: data.target,
            start_date: data.start_date.split("T")[0],
            duration_days: data.duration_days,
            end_date: data.end_date.split("T")[0],
            bet: data.bet || "",
            private: data.private,
          });
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setMsg({ text: "Erro ao carregar dados do desafio.", type: "error" });
          setLoading(false);
        });
    }
  }, [user, challengeId, API_URL]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      target: parseInt(formData.target),
      duration_days: parseInt(formData.duration_days),
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
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
        setMsg({ text: "Desafio atualizado com sucesso!", type: "success" });
        setTimeout(() => navigate("/challenges"), 2000);
      } else {
        const errorData = await res.json();
        setMsg({ text: errorData.detail || "Erro ao atualizar desafio.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMsg({ text: "Erro de conexão.", type: "error" });
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Carregando...</div>;
  }

  if (msg.type === "error" && !formData.title) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{msg.text}</p>
        <Link to="/challenges" className="text-blue-500 hover:underline">Voltar aos Desafios</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <FontAwesomeIcon icon={faEdit} className="mr-2 text-yellow-500" />
        Editar Desafio
      </h2>
      {msg.text && (
        <div className={`mb-4 p-2 rounded ${msg.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {msg.text}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">Título</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Descrição</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Modalidade</label>
          <select
            name="modality"
            value={formData.modality}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Selecione</option>
            <option value="academia">Academia</option>
            <option value="corrida">Corrida</option>
            <option value="calorias">Calorias</option>
            <option value="passos">Passos</option>
            <option value="artes marciais">Artes Marciais</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Meta</label>
          <input
            type="number"
            name="target"
            value={formData.target}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Data de Início</label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Duração (dias)</label>
          <input
            type="number"
            name="duration_days"
            value={formData.duration_days}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Data de Término</label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Regras / Aposta</label>
          <textarea
            name="bet"
            value={formData.bet}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="private"
              checked={formData.private}
              onChange={handleChange}
              className="mr-2"
            />
            Desafio Privado
          </label>
        </div>
        <button type="submit" className="w-full bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600">
          Atualizar Desafio
        </button>
      </form>
    </div>
  );
};

export default ChallengeEdit;