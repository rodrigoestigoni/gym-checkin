import React, { useEffect, useState } from "react";

const History = ({ user }) => {
  const [checkins, setCheckins] = useState([]);
  const [page, setPage] = useState(0);
  const limit = 10;
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
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
  }, [user, page]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Histórico de Checkins</h1>
      <ul>
        {checkins.map((ci) => (
          <li key={ci.id} className="border p-2 mb-2">
            <p>
              <strong>{new Date(ci.timestamp).toLocaleString()}</strong>
            </p>
            {ci.duration && <p>Duração: {ci.duration} minutos</p>}
            {ci.description && <p>Descrição: {ci.description}</p>}
          </li>
        ))}
      </ul>
      {checkins.length === limit && (
        <div className="flex justify-between mt-4">
          <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-4 py-2 bg-gray-300 rounded">
            Anterior
          </button>
          <button onClick={() => setPage(page + 1)} className="px-4 py-2 bg-gray-300 rounded">
            Próximo
          </button>
        </div>
      )}
    </div>
  );
};

export default History;
