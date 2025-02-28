// ChallengeHistory.jsx - Corrigido para evitar loops de requisição
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHistory, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { useChallenge } from '../contexts/ChallengeContext';

const ChallengeHistory = ({ user }) => {
  const { challengeId } = useParams();
  const { activeChallenge } = useChallenge();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState(null);
  const effectRan = useRef(false);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    // Prevenindo múltiplas chamadas durante o desenvolvimento em strict mode
    if (effectRan.current) return;
    
    let isMounted = true;
    
    const fetchData = async () => {
      if (!challengeId || !user?.token) return;
      
      try {
        // Se já temos o desafio no contexto, usamos ele
        if (activeChallenge && activeChallenge.id === parseInt(challengeId)) {
          if (isMounted) {
            setChallenge(activeChallenge);
          }
        } else {
          // Caso contrário, buscamos do servidor
          const challengeRes = await fetch(`${API_URL}/challenges/${challengeId}`, {
            headers: { 
              Authorization: `Bearer ${user.token}`,
              "Cache-Control": "no-cache"
            },
          });
          
          if (!isMounted) return;
          
          if (challengeRes.ok) {
            const challengeData = await challengeRes.json();
            setChallenge(challengeData);
          } else {
            throw new Error("Falha ao buscar informações do desafio");
          }
        }
        
        // Agora buscar check-ins
        const checkinsRes = await fetch(`${API_URL}/users/${user.id}/checkins/?skip=0&limit=100`, {
          headers: { 
            Authorization: `Bearer ${user.token}`,
            "Cache-Control": "no-cache"
          },
        });
        
        if (!isMounted) return;
        
        if (checkinsRes.ok) {
          const allCheckins = await checkinsRes.json();
          
          // Se temos o desafio, podemos filtrar os check-ins pelo período
          if (challenge || activeChallenge) {
            const targetChallenge = challenge || activeChallenge;
            const startDate = new Date(targetChallenge.start_date);
            const endDate = new Date(targetChallenge.end_date);
            
            // Filtrar check-ins que caem dentro do período do desafio
            const filteredCheckins = allCheckins.filter(checkin => {
              const checkinDate = new Date(checkin.timestamp);
              return checkinDate >= startDate && checkinDate <= endDate;
            });
            
            console.log(`Check-ins filtrados por período (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}):`, filteredCheckins.length);
            setCheckins(filteredCheckins);
          } else {
            // Se não temos o desafio, usamos todos os check-ins (não ideal)
            setCheckins(allCheckins);
          }
        } else {
          throw new Error("Falha ao buscar check-ins");
        }
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        if (isMounted) {
          setError(err.message || "Erro ao carregar dados");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          effectRan.current = true;
        }
      }
    };
    
    setLoading(true);
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [challengeId, user.id, user.token, activeChallenge]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 dark:bg-opacity-20 rounded-lg p-4 text-red-700 dark:text-red-300">
        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <FontAwesomeIcon icon={faHistory} className="mr-2 text-blue-500" />
        Histórico de Check-ins: {challenge?.title || activeChallenge?.title}
      </h2>

      {checkins.length === 0 ? (
        <div className="text-center py-8 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 rounded-lg">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 text-3xl mb-2" />
          <p className="text-gray-700 dark:text-gray-300">
            Você ainda não registrou nenhum check-in neste desafio.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Vá para a seção de Check-ins para registrar suas atividades!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {checkins.map((checkin) => (
            <div
              key={checkin.id}
              className="border p-4 rounded-lg bg-gray-50 dark:bg-gray-700 transition-all hover:shadow-md"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">
                    {new Date(checkin.timestamp).toLocaleString()}
                  </p>
                  {checkin.duration && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Duração: {checkin.duration} minutos
                    </p>
                  )}
                  {checkin.description && (
                    <p className="text-sm mt-2">{checkin.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChallengeHistory;