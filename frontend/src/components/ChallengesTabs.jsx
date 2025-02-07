// frontend/src/components/ChallengesTabs.jsx
import React, { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faPlusCircle, 
  faTrophy, 
  faUserCheck, 
  faSearch, 
  faListAlt, 
  faEnvelope 
} from '@fortawesome/free-solid-svg-icons';
import ChallengeList from "./ChallengeList"; // Desafios criados pelo usuário
import ChallengeCreate from "./ChallengeCreate";
import ChallengeRanking from "./ChallengeRanking";
import ChallengeInvite from "./ChallengeInvite";
import MyParticipatedChallenges from "./MyParticipatedChallenges";
import AllChallengeInvitations from "./AllChallengeInvitations";

const ChallengesTabs = ({ user }) => {
  // abas: "list", "create", "ranking", "invite", "participated", "invitations"
  const [activeTab, setActiveTab] = useState("list");

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Desafios</h1>
      <div className="flex border-b mb-4">
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${activeTab === "list" ? "border-b-2 border-green-500 font-bold" : "text-gray-600"}`}
          onClick={() => setActiveTab("list")}
        >
          <FontAwesomeIcon icon={faEye} className="mr-2" />
          Meus desafios
        </button>
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${activeTab === "create" ? "border-b-2 border-green-500 font-bold" : "text-gray-600"}`}
          onClick={() => setActiveTab("create")}
        >
          <FontAwesomeIcon icon={faPlusCircle} className="mr-2" />
          Criar desafio
        </button>
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${activeTab === "ranking" ? "border-b-2 border-green-500 font-bold" : "text-gray-600"}`}
          onClick={() => setActiveTab("ranking")}
        >
          <FontAwesomeIcon icon={faTrophy} className="mr-2" />
          Ranking
        </button>
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${activeTab === "invite" ? "border-b-2 border-green-500 font-bold" : "text-gray-600"}`}
          onClick={() => setActiveTab("invite")}
        >
          <FontAwesomeIcon icon={faSearch} className="mr-2" />
          Buscar
        </button>
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${activeTab === "participated" ? "border-b-2 border-green-500 font-bold" : "text-gray-600"}`}
          onClick={() => setActiveTab("participated")}
        >
          <FontAwesomeIcon icon={faListAlt} className="mr-2" />
          Minhas participações
        </button>
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${activeTab === "invitations" ? "border-b-2 border-green-500 font-bold" : "text-gray-600"}`}
          onClick={() => setActiveTab("invitations")}
        >
          <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
          Aprovar Convites
        </button>
      </div>
      <div>
        {activeTab === "list" && <ChallengeList user={user} />}
        {activeTab === "create" && <ChallengeCreate user={user} />}
        {activeTab === "ranking" && <ChallengeRanking />}
        {activeTab === "invite" && <ChallengeInvite user={user} />}
        {activeTab === "participated" && <MyParticipatedChallenges user={user} />}
        {activeTab === "invitations" && <AllChallengeInvitations user={user} />}
      </div>
    </div>
  );
};

export default ChallengesTabs;
