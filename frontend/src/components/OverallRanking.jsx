// frontend/src/components/OverallRanking.jsx
import React, { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faMedal, faDumbbell, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const OverallRanking = () => {
  const [overall, setOverall] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchInProgress = useRef(false);
  const isMounted = useRef(true);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  // Importante: Controlar o ciclo de vida do componente
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Função para buscar e processar dados do ranking
    const fetchRanking = async () => {
      // Evitar multiplas chamadas simultâneas
      if (fetchInProgress.current) return;
      fetchInProgress.current = true;

      try {
        setLoading(true);
        
        // Buscar o ranking geral com no-cache para evitar dados antigos
        const res = await fetch(`${API_URL}/ranking/overall`, {
          headers: { 
            "Cache-Control": "no-cache" 
          }
        });
        
        if (!isMounted.current) return;
        
        if (res.ok) {
          const data = await res.json();
          
          if (data.overall && Array.isArray(data.overall)) {
            // Verificar se os pontos estão presentes nos dados
            // Alguns usuários podem ter pontos incorretos ou ausentes
            const processedUsers = data.overall.map(user => {
              return {
                ...user,
                // Garantir que points seja um número e não null
                points: user.points || 0,
                total_checkins: user.total_checkins || 0
              };
            });
            
            // Ordenar usuários por pontos
            const sortedUsers = processedUsers.sort((a, b) => b.points - a.points);
            
            // Atribuímos rankings considerando possíveis empates
            let currentRank = 1;
            let currentPoints = -1;
            
            const rankedUsers = sortedUsers.map((user, index) => {
              if (user.points !== currentPoints) {
                currentRank = index + 1;
                currentPoints = user.points;
              }
              
              return {
                ...user,
                rank: currentRank
              };
            });
            
            if (isMounted.current) {
              setOverall(rankedUsers);
            }
          } else {
            if (isMounted.current) {
              setOverall([]);
            }
          }
        } else {
          throw new Error('Falha ao buscar ranking');
        }
      } catch (err) {
        console.error("Erro ao buscar ranking:", err);
        if (isMounted.current) {
          setError("Não foi possível carregar o ranking.");
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
        fetchInProgress.current = false;
      }
    };
    
    fetchRanking();
  }, [API_URL]);

  const getMedalIcon = (rank) => {
    switch (rank) {
      case 1:
        return <FontAwesomeIcon icon={faTrophy} className="text-yellow-400" />;
      case 2:
        return <FontAwesomeIcon icon={faMedal} className="text-gray-400" />;
      case 3:
        return <FontAwesomeIcon icon={faMedal} className="text-amber-600" />;
      default:
        return rank;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 dark:bg-opacity-20 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded flex items-center">
        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Ranking Geral</h1>
      
      {overall.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Nenhum usuário no ranking ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 shadow rounded">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="py-3 px-4 border-b dark:border-gray-600">Posição</th>
                <th className="py-3 px-4 border-b dark:border-gray-600">Usuário</th>
                <th className="py-3 px-4 border-b dark:border-gray-600">Pontos</th>
                <th className="py-3 px-4 border-b dark:border-gray-600">
                  <div className="flex items-center justify-center">
                    <FontAwesomeIcon icon={faDumbbell} className="mr-2" />
                    Total de Treinos
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {overall.map((user) => (
                <tr 
                  key={user.id} 
                  className={`
                    hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                    ${user.rank <= 3 ? 'bg-green-50 dark:bg-green-900 dark:bg-opacity-20' : ''}
                  `}
                >
                  <td className="py-3 px-4 border-b dark:border-gray-600 text-center">
                    <div className="flex items-center justify-center text-xl">
                      {getMedalIcon(user.rank)}
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b dark:border-gray-600">
                    <div className="flex items-center">
                      {user.profile_image ? (
                        <img
                          src={user.profile_image}
                          alt={user.username}
                          className="h-10 w-10 rounded-full object-cover mr-3"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-3">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium">{user.username}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b dark:border-gray-600 text-center font-bold">{user.points}</td>
                  <td className="py-3 px-4 border-b dark:border-gray-600 text-center">
                    <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 py-1 px-3 rounded-full">
                      {user.total_checkins || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OverallRanking;