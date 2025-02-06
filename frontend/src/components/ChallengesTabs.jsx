// ChallengesTabs.jsx
import React, { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPlusCircle, faTrophy, faUserCheck } from '@fortawesome/free-solid-svg-icons';
import ChallengeList from "./ChallengeList";
import ChallengeCreate from "./ChallengeCreate";
import ChallengeRanking from "./ChallengeRanking";
import ChallengeInvitations from "./ChallengeInvitations"; // para aprovar participantes

const ChallengesTabs = ({ user }) => {
  const [activeTab, setActiveTab] = useState("list"); // 'list', 'create', 'ranking', 'invitations'

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Desafios</h1>
      <div className="flex border-b mb-4">
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${activeTab === "list" ? "border-b-2 border-green-500 font-bold" : "text-gray-600"}`}
          onClick={() => setActiveTab("list")}
        >
          <FontAwesomeIcon icon={faEye} className="mr-2" />
          Visualizar
        </button>
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${activeTab === "create" ? "border-b-2 border-green-500 font-bold" : "text-gray-600"}`}
          onClick={() => setActiveTab("create")}
        >
          <FontAwesomeIcon icon={faPlusCircle} className="mr-2" />
          Criar
        </button>
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${activeTab === "ranking" ? "border-b-2 border-green-500 font-bold" : "text-gray-600"}`}
          onClick={() => setActiveTab("ranking")}
        >
          <FontAwesomeIcon icon={faTrophy} className="mr-2" />
          Ranking
        </button>
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${activeTab === "invitations" ? "border-b-2 border-green-500 font-bold" : "text-gray-600"}`}
          onClick={() => setActiveTab("invitations")}
        >
          <FontAwesomeIcon icon={faUserCheck} className="mr-2" />
          Convites
        </button>
      </div>
      <div>
        {activeTab === "list" && <ChallengeList />}
        {activeTab === "create" && <ChallengeCreate user={user} />}
        {activeTab === "ranking" && <ChallengeRanking />}
        {activeTab === "invitations" && <ChallengeInvitations user={user} />}
      </div>
    </div>
  );
};

export default ChallengesTabs;
