import React, { useEffect, useState } from "react";
import EditCheckinForm from "./EditCheckinForm";

const History = ({ user }) => {
  const [checkins, setCheckins] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(0);
  const limit = 10;
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const fetchCheckins = () => {
    if (user) {
      fetch(`${API_URL}/users/${user.id}/checkins/?skip=${page * limit}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((res) => res.json())
        .then(setCheckins)
        .catch((err) => console.error(err));
    }
  };

  useEffect(() => {
    fetchCheckins();
  }, [user, page, API_URL]);

  const handleEditSuccess = (updatedCheckin) => {
    if (!updatedCheckin) {
      // Checkin foi excluído
      setCheckins(checkins.filter((ci) => ci.id !== editingId));
    } else {
      setCheckins(checkins.map((ci) => (ci.id === updatedCheckin.id ? updatedCheckin : ci)));
    }
    setEditingId(null);
  };

  const handleDeleteCheckin = async (checkinId) => {
    if (window.confirm("Tem certeza que deseja excluir este checkin?")) {
      try {
        const res = await fetch(`${API_URL}/checkins/${checkinId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        if (res.ok) {
          setCheckins(checkins.filter((ci) => ci.id !== checkinId));
        } else {
          console.error("Erro ao excluir checkin");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Histórico de Checkins</h1>
      <ul>
        {checkins.map((ci) => (
          <li key={ci.id} className="border p-2 mb-2">
            {editingId === ci.id ? (
              <EditCheckinForm 
                checkin={ci} 
                user={user} 
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{new Date(ci.timestamp).toLocaleString()}</p>
                  {ci.duration && <p>Duração: {ci.duration} minutos</p>}
                  {ci.description && <p>Descrição: {ci.description}</p>}
                </div>
                <div className="flex flex-col space-y-1">
                  <button 
                    onClick={() => setEditingId(ci.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDeleteCheckin(ci.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {checkins.length === limit && (
        <div className="flex justify-between mt-4">
          <button 
            disabled={page === 0} 
            onClick={() => setPage(page - 1)} 
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Anterior
          </button>
          <button 
            onClick={() => setPage(page + 1)} 
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Próximo
          </button>
        </div>
      )}
    </div>
  );
};

export default History;
