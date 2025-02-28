// src/components/RecentActivityFeed.jsx - Corrigido
import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHistory, faCheckCircle, faUserPlus, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

const RecentActivityFeed = ({ challengeId, user }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Use uma referência para controlar se já está carregando
  const isLoadingRef = useRef(false);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    // Função para buscar atividades
    const fetchActivity = async () => {
      // Verificar se já está carregando ou se não tem ID
      if (isLoadingRef.current || !challengeId || !user?.token) return;
      
      // Marcar como carregando
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      try {
        console.log("Buscando atividades para o desafio:", challengeId);
        const res = await fetch(`${API_URL}/challenges/${challengeId}/activity`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log("Atividades recebidas:", data);
          setActivities(data);
        } else {
          console.error("Erro ao buscar atividades:", await res.text());
          setError("Erro ao carregar atividades");
        }
      } catch (err) {
        console.error("Erro ao buscar atividades:", err);
        setError("Erro de conexão");
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };
    
    // Chamar a função fetchActivity uma única vez
    fetchActivity();
    
    // Função de limpeza
    return () => {
      isLoadingRef.current = false;
    };
  }, [challengeId, user?.token, API_URL]);

  const getActivityIcon = (type) => {
    switch (type) {
      case "checkin":
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
      case "join":
        return <FontAwesomeIcon icon={faUserPlus} className="text-blue-500" />;
      default:
        return <FontAwesomeIcon icon={faHistory} className="text-gray-500" />;
    }
  };

  const getActivityText = (activity) => {
    switch (activity.type) {
      case "checkin":
        return `fez um check-in${activity.duration ? ` (${activity.duration} min)` : ""}`;
      case "join":
        return "entrou no desafio";
      default:
        return "fez algo";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
        {error}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <FontAwesomeIcon icon={faHistory} className="text-gray-400 text-4xl mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Ainda não há atividades registradas.</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Faça check-ins neste desafio para ver atividades aqui!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div 
          key={`${activity.type}-${activity.id}`}
          className="flex items-start p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div className="mr-3 mt-1">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center">
              {activity.profile_image ? (
                <img 
                  src={activity.profile_image} 
                  alt={activity.username}
                  className="w-6 h-6 rounded-full mr-2 object-cover"
                />
              ) : (
                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full mr-2 flex items-center justify-center text-xs">
                  {activity.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-medium">{activity.username}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {getActivityText(activity)}
            </p>
            {activity.description && (
              <p className="text-sm mt-1 bg-white dark:bg-gray-800 p-2 rounded">
                "{activity.description}"
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {new Date(activity.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivityFeed;