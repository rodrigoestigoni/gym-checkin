// frontend/src/components/OverallRanking.jsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faMedal, faDumbbell } from '@fortawesome/free-solid-svg-icons';
import { api } from "../services/api";

const computeOverallRanking = (users, scoreKey) => {
  // Ordena os usuários de forma decrescente pelo score
  const sortedUsers = [...users].sort((a, b) => b[scoreKey] - a[scoreKey]);
  let rankedUsers = [];
  let currentRank = 1;
  
  if (sortedUsers.length > 0) {
    rankedUsers.push({ ...sortedUsers[0], rank: currentRank });
  }
  
  for (let i = 1; i < sortedUsers.length; i++) {
    if (sortedUsers[i][scoreKey] < sortedUsers[i - 1][scoreKey]) {
      currentRank++;  // incrementa somente quando o score diminui
    }
    rankedUsers.push({ ...sortedUsers[i], rank: currentRank });
  }
  
  return rankedUsers;
};

const OverallRanking = () => {
  const [overall, setOverall] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        
        // Buscar o ranking geral padrão
        const res = await fetch(`${API_URL}/ranking/overall`);
        
        if (res.ok) {
          const data = await res.json();
          
          if (data.overall) {
            // Precisamos buscar o número total de check-ins para cada usuário
            // Como a API não fornece isso diretamente no endpoint de ranking,
            // precisamos fazer uma solução alternativa
            
            // Em um cenário ideal, a API forneceria essa informação diretamente,
            // mas vamos simular uma solução no frontend:
            
            const usersWithCheckinCount = await Promise.all(
              data.overall.map(async (user) => {
                try {
                  // Aqui estamos fazendo uma requisição individual para cada usuário
                  // Isso não é ideal em termos de performance, mas serve como solução temporária
                  // Em produção, seria melhor ter um endpoint dedicado para isso
                  const checkinRes = await fetch(`${API_URL}/users/${user.id}/checkins/?skip=0&limit=1000`, {
                    // Nota: em um cenário real, isso exigiria autenticação de admin
                    // Aqui é apenas uma demonstração da solução
                  });
                  
                  if (checkinRes.ok) {
                    const checkinData = await checkinRes.json();
                    return {
                      ...user,
                      total_checkins: checkinData.length
                    };
                  }
                  return {
                    ...user,
                    total_checkins: 0
                  };
                } catch (error) {
                  console.error(`Erro ao buscar check-ins do usuário ${user.id}:`, error);
                  return {
                    ...user,
                    total_checkins: 0
                  };
                }
              })
            );
            
            const computed = computeOverallRanking(usersWithCheckinCount, "points");
            setOverall(computed);
          } else {
            setOverall([]);
          }
        } else {
          throw new Error('Falha ao buscar ranking');
        }
      } catch (err) {
        console.error("Erro ao buscar ranking:", err);
        setError("Não foi possível carregar o ranking.");
      } finally {
        setLoading(false);
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
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
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
                <th className="py-3 px-4 border-b">Posição</th>
                <th className="py-3 px-4 border-b">Usuário</th>
                <th className="py-3 px-4 border-b">Pontos</th>
                <th className="py-3 px-4 border-b">
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
                  <td className="py-3 px-4 border-b text-center">
                    <div className="flex items-center justify-center text-xl">
                      {getMedalIcon(user.rank)}
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b">
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
                  <td className="py-3 px-4 border-b text-center font-bold">{user.points}</td>
                  <td className="py-3 px-4 border-b text-center">
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