// frontend/src/components/ChallengesDashboard.jsx
import React, { useState } from "react";
import ChallengeList from "./ChallengeList";              // Desafios criados por mim
import MyParticipatedChallenges from "./MyParticipatedChallenges"; // Desafios que participo
import AllChallengeInvitations from "./AllChallengeInvitations"; // Convites pendentes para aprovação
import ChallengeCreate from "./ChallengeCreate";          // Formulário para criar desafio
import ChallengeRankingView from "./ChallengeRankingView";  // Seleciona e exibe ranking de um desafio
import ChallengeInvite from "./ChallengeInvite";            // Buscar desafio por código

const ChallengesDashboard = ({ user }) => {
  // Quatro abas principais para modularizar:
  // "dashboard": agrupa meus desafios, participações e convites
  // "create": criar desafio
  // "ranking": ranking dos desafios (selecionável)
  // "search": buscar desafio por código
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
          <div className="space-y-8">
            <ChallengeList user={user} />
            <MyParticipatedChallenges user={user} />
            <AllChallengeInvitations user={user} />
          </div>
        )}
        {activeTab === "create" && <ChallengeCreate user={user} />}
        {activeTab === "ranking" && <ChallengeRankingView user={user} />}
        {activeTab === "search" && <ChallengeInvite user={user} />}
      </div>
    </div>
  );
};

export default ChallengesDashboard;
