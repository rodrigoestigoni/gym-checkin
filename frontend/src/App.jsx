// frontend/src/App.jsx
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Login from './components/Login';
import CheckinForm from './components/CheckinForm';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Ranking from './components/Ranking';

const App = () => {
  // Armazena dados do usuário (token, id, username, etc)
  const [user, setUser] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={user} setUser={setUser} />
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/checkin" element={<CheckinForm user={user} />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/history" element={<History user={user} />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/" element={<Dashboard user={user} />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
