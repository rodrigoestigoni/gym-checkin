import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faDumbbell } from '@fortawesome/free-solid-svg-icons';

const Dashboard = ({ user }) => {
  const [weeklyCheckins, setWeeklyCheckins] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const MIN_TRAINING_DAYS = 3;

  useEffect(() => {
    if (user) {
      fetch(`${API_URL}/users/${user.id}/checkins/week/`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setWeeklyCheckins(data);
        })
        .catch((err) => console.error(err));
    }
  }, [user, API_URL]);

  useEffect(() => {
    // Array de dias da semana (supondo domingo como início)
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    // Para cada dia, filtra os checkins que ocorreram nesse dia (usando getDay)
    const week = days.map((day, index) => {
      const dayCheckins = weeklyCheckins.filter((ci) => {
        const date = new Date(ci.timestamp);
        return date.getDay() === index;
      });
      return {
        day,
        checkins: dayCheckins,
      };
    });
    setWeekData(week);
  }, [weeklyCheckins]);

  const totalCheckins = weeklyCheckins.length;
  const missing = totalCheckins < MIN_TRAINING_DAYS ? MIN_TRAINING_DAYS - totalCheckins : 0;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Minha Semana</h1>
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekData.map((item, index) => (
          <div key={index} className="p-2 border rounded flex flex-col items-center">
            <div className="font-bold mb-2">{item.day}</div>
            {item.checkins.length > 0 ? (
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-2xl" />
            ) : (
              <FontAwesomeIcon icon={faTimesCircle} className="text-red-500 text-2xl" />
            )}
          </div>
        ))}
      </div>
      <div className="text-center">
        {totalCheckins < MIN_TRAINING_DAYS ? (
          <p className="text-xl text-orange-600">
            Faltam {missing} treino{missing > 1 ? "s" : ""} para atingir o mínimo da semana!
          </p>
        ) : (
          <p className="text-xl text-green-600">
            Parabéns! Você completou o mínimo de treinos desta semana!
          </p>
        )}
      </div>
      <div className="flex justify-center mt-4">
        <FontAwesomeIcon icon={faDumbbell} className="text-gray-500 text-4xl animate-bounce" />
      </div>
    </div>
  );
};

export default Dashboard;
