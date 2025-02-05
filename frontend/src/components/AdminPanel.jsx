import React, { useEffect, useState } from "react";

const AdminPanel = ({ user }) => {
  const [users, setUsers] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (user && user.token && user.is_admin) {
      fetch(`${API_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((res) => res.json())
        .then(setUsers)
        .catch((err) => console.error(err));
    }
  }, [user, API_URL]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Painel Administrativo</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 border">ID</th>
            <th className="py-2 border">Usuário</th>
            <th className="py-2 border">Status</th>
            <th className="py-2 border">Imagem de Perfil</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="py-2 border text-center">{u.id}</td>
              <td className="py-2 border text-center">{u.username}</td>
              <td className="py-2 border text-center">{u.status}</td>
              <td className="py-2 border text-center">
                {u.profile_image ? (
                  <img src={u.profile_image} alt="perfil" className="h-10 w-10 rounded-full mx-auto" />
                ) : (
                  "Sem imagem"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;
