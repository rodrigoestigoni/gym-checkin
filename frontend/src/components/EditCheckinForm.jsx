import React, { useState } from "react";

const EditCheckinForm = ({ checkin, user, onCancel, onSuccess }) => {
  const [duration, setDuration] = useState(checkin.duration || "");
  const [description, setDescription] = useState(checkin.description || "");
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/checkins/${checkin.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ duration, description }),
      });
      if (res.ok) {
        const data = await res.json();
        onSuccess(data);
      } else {
        console.error("Erro ao atualizar checkin");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/checkins/${checkin.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (res.ok) {
        onSuccess(null);
      } else {
        console.error("Erro ao deletar checkin");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="p-4 border rounded mb-4 bg-gray-50">
      <div className="mb-2">
        <label className="block text-gray-700">Duração (minutos):</label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-2">
        <label className="block text-gray-700">Descrição:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        ></textarea>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Atualizar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Excluir
          </button>
        </div>
        <button type="button" onClick={onCancel} className="text-gray-600 hover:text-gray-900">
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default EditCheckinForm;
