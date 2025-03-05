import React, { useState } from "react";
import DarkModeToggle from "./DarkModeToggle"; 

const Profile = ({ user, setUser }) => {
  const [username, setUsername] = useState(user.username);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("username", username);
    if (file) {
      formData.append("file", file);
    }

    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setUser({
          ...user,
          username: data.username,
          profile_image: data.profile_image,
        });
        setMsg("Perfil atualizado com sucesso!");
      } else {
        setMsg("Erro ao atualizar perfil.");
      }
    } catch (err) {
      console.error(err);
      setMsg("Erro de conexão.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 rounded mt-8 bg-white dark:bg-gray-800 dark:text-white shadow">
      <h2 className="text-2xl font-bold mb-4">Meu Perfil</h2>
      {msg && <p className="mb-2 text-green-500">{msg}</p>}
      <form onSubmit={handleUpdate}>
        <div className="mb-4">
          <label className="block text-gray-500 dark:text-gray-400">Usuário:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded text-gray-500 dark:text-gray-400"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-500 dark:text-gray-400">Imagem de Perfil:</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full"
          />
        </div>
        {user.profile_image && (
          <div className="mb-4">
            <p className="text-gray-500 dark:text-gray-400">Imagem Atual:</p>
            <img src={user.profile_image} alt="Perfil" className="h-24 w-24 rounded-full" />
          </div>
        )}
        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
          Atualizar Perfil
        </button>
      </form>
      <div className="mt-4 flex justify-center">
        <DarkModeToggle />
      </div>
    </div>
  );
};

export default Profile;
