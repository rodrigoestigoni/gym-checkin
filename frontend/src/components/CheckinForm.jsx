import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const CheckinForm = ({ user }) => {
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(""); // novo campo para data
  const [msg, setMsg] = useState({ text: "", type: "" });
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  if (!user) return <p>Por favor, faça login.</p>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Se a data for fornecida, converta para ISO string
    const payload = {
      user_id: user.id,
      duration: duration ? parseFloat(duration) : null,
      description: description || null,
      ...(date && { timestamp: new Date(date).toISOString() })
    };
    try {
      const res = await fetch(`${API_URL}/checkin/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setMsg({ text: "Checkin realizado com sucesso!", type: "success" });
        setDuration("");
        setDescription("");
        setDate("");
      } else {
        setMsg({ text: "Erro ao realizar checkin.", type: "error" });
      }
    } catch (error) {
      console.error(error);
      setMsg({ text: "Erro de conexão com o servidor.", type: "error" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <FontAwesomeIcon icon={faCheckCircle} className="mr-2 text-green-500" />
        Fazer Checkin
      </h2>
      {msg.text && (
        <div className={`mb-4 p-2 rounded ${msg.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {msg.text}
        </div>
      )}
      <div className="mb-4">
        <label className="block text-gray-700">
          Tempo do treino (minutos) <span className="text-sm text-gray-400">(opcional)</span>
        </label>
        <input 
          type="number" 
          value={duration}
          onChange={e => setDuration(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">
          Descrição <span className="text-sm text-gray-400">(opcional)</span>
        </label>
        <textarea 
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        ></textarea>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">
          Data do Checkin <span className="text-sm text-gray-400">(se não marcado, usa a data atual)</span>
        </label>
        <input 
          type="date" 
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
        Confirmar Checkin
      </button>
    </form>
  );
};

export default CheckinForm;
