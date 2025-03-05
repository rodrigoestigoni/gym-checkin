// frontend/src/components/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const handleRegister = async (e) => {
    e.preventDefault();
    console.log("handleRegister disparado");
    setError("");
    setMsg("");

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    const payload = { username, password, is_admin: false };
    console.log("Payload:", payload);

    try {
      const response = await fetch(`${API_URL}/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      console.log("Resposta do fetch:", response);

      if (response.ok) {
        setMsg("Registro realizado com sucesso! Redirecionando para login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        const data = await response.json();
        console.log("Resposta de erro:", data);
        setError(data.detail || "Erro ao registrar usuário.");
      }
    } catch (err) {
      console.error("Erro no fetch:", err);
      setError("Erro de conexão com o servidor.");
    }
  };

  console.log("Register component renderizado");

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Registro de Usuário</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {msg && <p className="text-green-500 mb-2">{msg}</p>}
      <form onSubmit={handleRegister}>
        <div className="mb-4">
          <label className="block text-gray-700">Usuário</label>
          <input 
            type="text" 
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Digite seu usuário"
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
            placeholder="Digite sua senha"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Confirme a Senha</label>
          <input 
            type="password" 
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Confirme sua senha"
            required
          />
        </div>
        <button 
          type="submit"
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Registrar
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        Já tem uma conta? <Link to="/login" className="text-blue-500 hover:underline">Faça login</Link>
      </p>
    </div>
  );
};

export default Register;
