// ImprovedDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFire, faTrophy, faChartLine } from '@fortawesome/free-solid-svg-icons';

const ImprovedDashboard = ({ user }) => {
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    // Fetch both active challenges and pending invitations
    const fetchData = async () => {
      try {
        const [challengesRes, invitationsRes] = await Promise.all([
          fetch(`${API_URL}/challenge-participation/`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          fetch(`${API_URL}/challenge-invitations/`, {
            headers: { Authorization: `Bearer ${user.token}` },
          })
        ]);

        if (challengesRes.ok) {
          const data = await challengesRes.json();
          setActiveChallenges(data);
        }

        if (invitationsRes.ok) {
          const data = await invitationsRes.json();
          setPendingInvitations(data);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchData();
  }, [API_URL, user.token]);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meus Desafios</h1>
        <Link 
          to="/challenges/create" 
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow flex items-center"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Novo Desafio
        </Link>
      </div>

      {/* Desafios Ativos */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <FontAwesomeIcon icon={faFire} className="mr-2 text-orange-500" />
          Desafios Ativos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeChallenges.length === 0 ? (
            <div className="col-span-full text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-500 dark:text-gray-400">Nenhum desafio ativo no momento.</p>
              <Link to="/challenges/search" className="text-blue-500 hover:underline mt-2 inline-block">
                Encontrar um desafio
              </Link>
            </div>
          ) : (
            activeChallenges.map((item) => {
              const { challenge, participant } = item;
              // Calcula o progresso
              const progress = (participant.progress / challenge.target) * 100;
              
              return (
                <div 
                  key={challenge.id} 
                  className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-transform hover:scale-105"
                >
                  <div className="h-2 bg-gray-200 dark:bg-gray-700">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${Math.min(100, progress)}%` }}
                    ></div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg">{challenge.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{challenge.modality}</p>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs">{participant.progress} / {challenge.target}</span>
                      <span className="text-xs">{Math.round(progress)}%</span>
                    </div>
                    <Link 
                      to={`/challenge/${challenge.id}/dashboard`}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded block text-center"
                    >
                      Ver Desafio
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Invites Section */}
      {pendingInvitations.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Convites Pendentes</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            {pendingInvitations.map((item) => (
              <div key={item.participant.id} className="border-b last:border-0 py-3 flex justify-between items-center">
                <div>
                  <p className="font-bold">{item.challenge.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Criado por: {item.challenge.creator?.username || "Desconhecido"}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button className="bg-green-500 text-white px-3 py-1 rounded text-sm">
                    Aceitar
                  </button>
                  <button className="bg-red-500 text-white px-3 py-1 rounded text-sm">
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2 flex items-center">
            <FontAwesomeIcon icon={faChartLine} className="mr-2 text-blue-500" />
            Estatísticas
          </h3>
          <p className="text-3xl font-bold">{activeChallenges.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Desafios ativos</p>
        </div>

        {/* Add more stats cards as needed */}
      </section>

      {/* Recent Activity / Feed */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Atividade Recente</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          {/* Activity items would go here */}
          <p className="text-center text-gray-500 dark:text-gray-400">Nenhuma atividade recente.</p>
        </div>
      </section>
    </div>
  );
};

export default ImprovedDashboard;