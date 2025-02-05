// RankingTabs.jsx
import React, { useState } from "react";
import RankingWeekly from "./RankingWeekly";
import OverallRanking from "./OverallRanking";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faMedal } from '@fortawesome/free-solid-svg-icons';

const RankingTabs = () => {
  const [activeTab, setActiveTab] = useState("weekly");

  return (
    <div className="container mx-auto p-4">
      <div className="flex border-b mb-4">
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${
            activeTab === "weekly"
              ? "border-b-2 border-green-500 font-bold"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("weekly")}
        >
          <FontAwesomeIcon icon={faTrophy} className="mr-2" />
          Ranking da Semana
        </button>
        <button
          className={`flex-1 px-4 py-2 focus:outline-none flex items-center justify-center ${
            activeTab === "overall"
              ? "border-b-2 border-green-500 font-bold"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("overall")}
        >
          <FontAwesomeIcon icon={faMedal} className="mr-2" />
          Ranking das Semanas
        </button>
      </div>
      <div>
        {activeTab === "weekly" ? <RankingWeekly /> : <OverallRanking />}
      </div>
    </div>
  );
};

export default RankingTabs;
