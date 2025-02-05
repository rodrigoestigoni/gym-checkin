import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ setUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${API_URL}/token`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        // Salve no localStorage
        localStorage.setItem("user", JSON.stringify({
        id: data.user.id,
        username: data.user.username,
        status: data.user.status,
        token: data.access_token,
        is_admin: data.user.is_admin,
        profile_image: data.user.profile_image  // se houver
        }));
        setUser({
        id: data.user.id,
        username: data.user.username,
        status: data.user.status,
        token: data.access_token,
        is_admin: data.user.is_admin,
        profile_image: data.user.profile_image,
        });
        navigate("/dashboard");
      } else {
        setErro("Credenciais incorretas!");
      }
    } catch (error) {
      console.error(error);
      setErro("Erro na autenticação.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      {erro && <p className="text-red-500 mb-2">{erro}</p>}
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-gray-700">Usuário</label>
          <input 
            type="text" 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Senha</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">Entrar</button>
      </form>
    </div>
  );
};

export default Login;
