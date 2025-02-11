// frontend/src/components/ChallengesDashboard.jsx
import React, { useState } from "react";
import ChallengeList from "./ChallengeList"; // Desafios criados pelo usuário
import MyParticipatedChallenges from "./MyParticipatedChallenges"; // Desafios em que o usuário participa
import AllChallengeInvitations from "./AllChallengeInvitations"; // Convites pendentes para aprovação
import ChallengeCreate from "./ChallengeCreate";
import ChallengeRanking from "./ChallengeRanking";
import ChallengeInvite from "./ChallengeInvite";

const ChallengesDashboard = ({ user }) => {
  // Definimos 4 abas principais: Dashboard (agrupa Meus Desafios, Participações e Convites),
  // Criar Desafio, Ranking e Buscar
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Desafios</h1>
      <div className="flex border-b mb-4">
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${
            activeTab === "dashboard" ? "border-b-2 border-green-500 font-bold" : "text-gray-600"
          }`}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${
            activeTab === "create" ? "border-b-2 border-green-500 font-bold" : "text-gray-600"
          }`}
          onClick={() => setActiveTab("create")}
        >
          Criar Desafio
        </button>
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${
            activeTab === "ranking" ? "border-b-2 border-green-500 font-bold" : "text-gray-600"
          }`}
          onClick={() => setActiveTab("ranking")}
        >
          Ranking
        </button>
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${
            activeTab === "search" ? "border-b-2 border-green-500 font-bold" : "text-gray-600"
          }`}
          onClick={() => setActiveTab("search")}
        >
          Buscar
        </button>
      </div>

      <div>
        {activeTab === "dashboard" && (
          <div>
            {/* Agrupa os desafios criados, participações e convites pendentes */}
            <ChallengeList user={user} />
            <MyParticipatedChallenges user={user} />
            <AllChallengeInvitations user={user} />
          </div>
        )}
        {activeTab === "create" && <ChallengeCreate user={user} />}
        {activeTab === "ranking" && <ChallengeRanking user={user} />}
        {activeTab === "search" && <ChallengeInvite user={user} />}
      </div>
    </div>
  );
};

export default ChallengesDashboard;
