// ChallengeDynamicCheckinForm.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCheckCircle, faDumbbell, faBook, faWalking, 
  faRunning, faFire 
} from "@fortawesome/free-solid-svg-icons";
import { useChallenge } from '../contexts/ChallengeContext';

const ChallengeDynamicCheckinForm = ({ user }) => {
  const { challengeId } = useParams();
  const { activeChallenge } = useChallenge();
  const [challenge, setChallenge] = useState(null);
  const [formData, setFormData] = useState({
    duration: "",
    description: "",
    date: "",
    value: "", // Dynamic value based on challenge type (steps, pages, etc.)
  });
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (activeChallenge) {
      setChallenge(activeChallenge);
    } else if (challengeId) {
      // Fetch challenge data if not available in context
      fetch(`${API_URL}/challenges/${challengeId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
        .then((res) => res.json())
        .then((data) => setChallenge(data))
        .catch((err) => console.error("Error fetching challenge:", err));
    }
  }, [challengeId, activeChallenge, user.token, API_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getInputLabel = () => {
    if (!challenge) return "Valor";
    
    switch (challenge.modality) {
      case "academia":
        return "Duração (minutos)";
      case "corrida":
        return "Distância (km)";
      case "passos":
        return "Quantidade de passos";
      case "leitura":
        return "Páginas lidas";
      case "investimento":
        return "Valor (R$)";
      default:
        return "Valor";
    }
  };

  const getInputType = () => {
    if (!challenge) return "number";
    
    switch (challenge.modality) {
      case "corrida":
        return "number"; // Could use a decimal input
      case "passos":
        return "number";
      case "leitura":
        return "number";
      case "investimento":
        return "number"; // Could use a currency input
      default:
        return "number";
    }
  };

  const getInputStep = () => {
    if (!challenge) return "any";
    
    switch (challenge.modality) {
      case "corrida":
        return "0.01"; // Allow decimal values for km
      case "passos":
        return "1"; // Whole numbers only
      case "leitura":
        return "1"; // Whole numbers only
      case "investimento":
        return "0.01"; // Allow decimal values for currency
      default:
        return "any";
    }
  };

  const getMeasurementUnit = () => {
    if (!challenge) return "";
    
    switch (challenge.modality) {
      case "academia":
        return "min";
      case "corrida":
        return "km";
      case "passos":
        return "passos";
      case "leitura":
        return "páginas";
      case "investimento":
        return "R$";
      default:
        return "";
    }
  };

  const getIcon = () => {
    if (!challenge) return faCheckCircle;
    
    switch (challenge.modality) {
      case "academia":
        return faDumbbell;
      case "corrida":
        return faRunning;
      case "passos":
        return faWalking;
      case "leitura":
        return faBook;
      case "investimento":
        return faFire;
      default:
        return faCheckCircle;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      user_id: user.id,
      timestamp: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
      description: formData.description || null
    };
    
    // Add appropriate field based on challenge type
    if (challenge?.modality === "academia") {
      payload.duration = formData.value ? parseFloat(formData.value) : null;
    } else {
      // For other challenge types, we'll include both the specialized field and duration
      payload.duration = formData.duration ? parseFloat(formData.duration) : null;
      payload.value = formData.value ? parseFloat(formData.value) : null;
    }

    try {
      const res = await fetch(`${API_URL}/challenges/${challengeId}/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMsg({ text: "Check-in realizado com sucesso!", type: "success" });
        setFormData({
          duration: "",
          description: "",
          date: "",
          value: "",
        });
      } else {
        const errorData = await res.json();
        setMsg({ 
          text: errorData.detail || "Erro ao realizar check-in.", 
          type: "error" 
        });
      }
    } catch (error) {
      console.error(error);
      setMsg({ text: "Erro de conexão.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!challenge) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FontAwesomeIcon icon={getIcon()} className="mr-2 text-green-500" />
          Check-in: {challenge.title}
        </h2>

        {msg.text && (
          <div
            className={`mb-4 p-2 rounded ${
              msg.type === "success" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:bg-opacity-20 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:bg-opacity-20 dark:text-red-300"
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* Dynamic input based on challenge type */}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300">
            {getInputLabel()} <span className="text-sm text-gray-400">(obrigatório)</span>
          </label>
          <div className="flex">
            <input
              type={getInputType()}
              step={getInputStep()}
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              className="w-full p-2 border rounded-l dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
            {getMeasurementUnit() && (
              <span className="bg-gray-200 dark:bg-gray-600 px-3 flex items-center rounded-r border border-l-0 dark:border-gray-600">
                {getMeasurementUnit()}
              </span>
            )}
          </div>
        </div>

        {/* Show duration field only if not a workout challenge */}
        {challenge.modality !== "academia" && (
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">
              Duração (minutos) <span className="text-sm text-gray-400">(opcional)</span>
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300">
          Descrição <span className="text-sm text-gray-400">(opcional)</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows="3"
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300">
            Data <span className="text-sm text-gray-400">(se não marcado, usa a data atual)</span>
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full ${
            loading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
          } text-white p-2 rounded transition-colors flex items-center justify-center`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Enviando...
            </>
          ) : (
            "Confirmar Check-in"
          )}
        </button>
      </form>
    </div>
  );
};

export default ChallengeDynamicCheckinForm;