import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Login from "./components/Login";
import Register from "./components/Register";
import CheckinForm from "./components/CheckinForm";
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import RankingTabs from "./components/RankingTabs";
import PrivateRoute from "./components/PrivateRoute";
import Profile from "./components/Profile";
import ChallengesTabs from "./components/ChallengesTabs";
import ChallengeEdit from "./components/ChallengeEdit";


const App = () => {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={user} setUser={setUser} />
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/checkin" element={<PrivateRoute user={user}><CheckinForm user={user} /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute user={user}><Dashboard user={user} /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute user={user}><History user={user} /></PrivateRoute>} />
          <Route path="/ranking" element={<PrivateRoute user={user}><RankingTabs /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute user={user}><Profile user={user} setUser={setUser} /></PrivateRoute>} />
          <Route path="/challenges/*" element={<PrivateRoute user={user}><ChallengesTabs user={user} /></PrivateRoute>} />
          <Route path="/challenges/:challengeId/edit" element={<PrivateRoute user={user}><ChallengeEdit user={user} /></PrivateRoute>} />
          <Route path="/" element={<PrivateRoute user={user}><Dashboard user={user} /></PrivateRoute>} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
