import React, { useEffect, useState } from "react";

const RankingWeekly = () => {
  const [podium, setPodium] = useState([]);
  const [summary, setSummary] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetch(`${API_URL}/ranking/weekly`)
      .then((res) => res.json())
      .then((data) => {
        setPodium(data.podium);
        setSummary(data.summary);
      })
      .catch((err) => console.error(err));
  }, [API_URL]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Ranking Semanal - Podium</h1>
      <div className="flex justify-center items-end space-x-4 mb-8">
        {podium.map((user, index) => (
          <div key={user.id} className="flex flex-col items-center">
            <div className="bg-white p-2 rounded-full border shadow">
              {user.profile_image ? (
                <img src={user.profile_image} alt={user.username} className="h-16 w-16 rounded-full" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="mt-2 text-xl font-bold">{index + 1}º</div>
            <div className="mt-1">{user.username}</div>
            <div className="text-sm text-gray-600">{user.points} pts</div>
            <div className="text-sm text-gray-500">Score: {user.weekly_score}</div>
          </div>
        ))}
      </div>
      <h2 className="text-2xl font-bold mb-4 text-center">Resumo - Semanas Vencidas</h2>
      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th className="py-2 border">Usuário</th>
            <th className="py-2 border">Semanas Vencidas</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((item) => (
            <tr key={item.id}>
              <td className="py-2 border text-center flex items-center justify-center space-x-2">
                {item.profile_image ? (
                  <img src={item.profile_image} alt={item.username} className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    {item.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span>{item.username}</span>
              </td>
              <td className="py-2 border text-center">{item.weeks_won}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RankingWeekly;
