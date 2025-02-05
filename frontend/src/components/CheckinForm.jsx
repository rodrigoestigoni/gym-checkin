import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const CheckinForm = ({ user }) => {
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState("");

  if (!user) return <p>Por favor, faça login.</p>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      user_id: user.id,
      duration: duration ? parseFloat(duration) : null,
      description: description || null
    };
    try {
      const res = await fetch("http://localhost:8000/checkin/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setMsg("Checkin realizado com sucesso!");
        setDuration("");
        setDescription("");
      } else {
        setMsg("Erro ao realizar checkin.");
      }
    } catch (error) {
      console.error(error);
      setMsg("Erro ao conectar com o servidor.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <FontAwesomeIcon icon={faCheckCircle} className="mr-2 text-green-500" /> Fazer Checkin
      </h2>
      {msg && <p className="mb-2">{msg}</p>}
      <div className="mb-4">
        <label className="block text-gray-700">Tempo do treino (minutos) <span className="text-sm text-gray-400">(opcional)</span></label>
        <input 
          type="number" 
          value={duration}
          onChange={e => setDuration(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Descrição <span className="text-sm text-gray-400">(opcional)</span></label>
        <textarea 
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        ></textarea>
      </div>
      <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
        Confirmar Checkin
      </button>
    </form>
  );
};

export default CheckinForm;
