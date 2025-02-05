import React, { useEffect, useState } from 'react';

const History = ({ user }) => {
  const [checkins, setCheckins] = useState([]);
  const [page, setPage] = useState(0);
  const limit = 5;

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:8000/users/${user.id}/checkins/?skip=${page * limit}&limit=${limit}`, {
        headers: {
          "Authorization": `Bearer ${user.token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          setCheckins(data);
        });
    }
  }, [user, page]);

  if (!user) return <p>Por favor, faça login.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Histórico de Checkins</h1>
      <div className="mb-4">
        {/* integrar um componente de calendário */}
        <ul>
          {checkins.map(ci => (
            <li key={ci.id} className="p-2 border-b">
              <p><strong>{new Date(ci.timestamp).toLocaleString()}</strong></p>
              {ci.duration && <p>Duração: {ci.duration} minutos</p>}
              {ci.description && <p>Descrição: {ci.description}</p>}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-between">
        <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-4 py-2 bg-gray-300 rounded">Anterior</button>
        <button onClick={() => setPage(page + 1)} className="px-4 py-2 bg-gray-300 rounded">Próximo</button>
      </div>
    </div>
  );
};

export default History;
