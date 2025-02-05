import React, { useEffect, useState } from "react";

const Dashboard = ({ user }) => {
  const [weeklyCheckins, setWeeklyCheckins] = useState([]);
  const [status, setStatus] = useState("normal");

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:8000/users/${user.id}/checkins/week/`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setWeeklyCheckins(data);
          setStatus(user.status || "normal");
        });
    }
  }, [user]);

  if (!user) return <p>Por favor, faça login.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Minha Semana</h1>
      <p>
        Status:{" "}
        <span
          className={`font-bold ${
            status === "verde" ? "text-green-500" : "text-gray-700"
          }`}
        >
          {status}
        </span>
      </p>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 mt-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="p-2 border rounded text-center bg-white">
            <p className="font-bold">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][index]}
            </p>
            <p>
              {
                weeklyCheckins.filter((ci) => {
                  const date = new Date(ci.timestamp);
                  // Agrupe pelo dia da semana
                  return date.getDay() === index;
                }).length
              }{" "}
              checkins
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
