// ChallengeRankingTabs.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faMedal } from '@fortawesome/free-solid-svg-icons';
import { useChallenge } from '../contexts/ChallengeContext';
import ChallengeWeeklyRanking from "./ChallengeWeeklyRanking";
import ChallengeOverallRanking from "./ChallengeOverallRanking";

const ChallengeRankingTabs = ({ user }) => {
  const { challengeId } = useParams();
  const { activeChallenge } = useChallenge();
  const [activeTab, setActiveTab] = useState("weekly");

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">
        {activeChallenge?.title || 'Ranking do Desafio'}
      </h1>
      
      <div className="flex border-b mb-4">
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${
            activeTab === "weekly" ? "border-b-2 border-green-500 font-bold" : "text-gray-600 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("weekly")}
        >
          <FontAwesomeIcon icon={faTrophy} className="mr-2" />
          Ranking da Semana
        </button>
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${
            activeTab === "overall" ? "border-b-2 border-green-500 font-bold" : "text-gray-600 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("overall")}
        >
          <FontAwesomeIcon icon={faMedal} className="mr-2" />
          Ranking Geral
        </button>
      </div>
      <div>
        {activeTab === "weekly" ? 
          <ChallengeWeeklyRanking user={user} challengeId={challengeId} /> : 
          <ChallengeOverallRanking user={user} challengeId={challengeId} />
        }
      </div>
    </div>
  );
};

export default ChallengeRankingTabs;