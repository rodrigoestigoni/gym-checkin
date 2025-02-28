// ChallengeDashboard.jsx - Correção do problema de carregamento
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faChartLine, 
  faUsers, 
  faDumbbell, 
  faTrophy, 
  faHistory
} from '@fortawesome/free-solid-svg-icons';
import { useChallenge } from '../contexts/ChallengeContext';

const ChallengeDashboard = ({ user }) => {
  const { challengeId } = useParams();
  const { activeChallenge } = useChallenge();
  const [challengeData, setChallengeData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [userProgress, setUserProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  // UseEffect com controle de requisição para evitar loops
  useEffect(() => {
    let isMounted = true; // Flag para verificar se o componente ainda está montado
    
    const fetchData = async () => {
      if (!challengeId || !user?.token) return;
      
      try {
        console.log("Iniciando requisição para o desafio:", challengeId);
        
        // Buscar desafio
        const challengeRes = await fetch(`${API_URL}/challenges/${challengeId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        
        if (!isMounted) return; // Evita atualizar o estado se o componente foi desmontado
        
        if (challengeRes.ok) {
          const challenge = await challengeRes.json();
          console.log("Dados do desafio recebidos:", challenge);
          setChallengeData(challenge);
          
          // Continuar com outras requisições depois que temos o desafio
          try {
            // Buscar os participantes do desafio
            const participantsRes = await fetch(`${API_URL}/challenges/${challengeId}/participants`, {
              headers: { Authorization: `Bearer ${user.token}` },
            });
            
            if (!isMounted) return;
            
            if (participantsRes.ok) {
              const participantsData = await participantsRes.json();
              console.log("Participantes:", participantsData);
              setParticipants(participantsData);
            }
            
            // Buscar check-ins do usuário
            const checkinsRes = await fetch(`${API_URL}/users/${user.id}/checkins/?skip=0&limit=100`, {
              headers: { Authorization: `Bearer ${user.token}` },
            });
            
            if (!isMounted) return;
            
            if (checkinsRes.ok) {
              const checkinsData = await checkinsRes.json();
              // Por enquanto assumir que todos os check-ins são do desafio
              // Em uma solução futura, fazer a filtragem correta
              const total = checkinsData.length;
              console.log(`Total de check-ins: ${total}`);
              setUserProgress(total);
            }
          } catch (error) {
            console.error("Erro ao buscar dados adicionais:", error);
          }
        } else {
          console.error("Erro ao buscar dados do desafio:", await challengeRes.text());
        }
      } catch (err) {
        if (isMounted) {
          console.error("Erro na requisição:", err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // Iniciar a busca de dados
    setLoading(true);
    fetchData();
    
    // Cleanup function para evitar memory leaks
    return () => {
      isMounted = false;
    };
  }, [challengeId, user, API_URL]);

  // O resto da renderização permanece o mesmo...
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  const challenge = activeChallenge || challengeData;
  if (!challenge) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Desafio não encontrado.</p>
      </div>
    );
  }
  
  // Calcular progresso
  const target = challenge.target || 0;
  const progressPercentage = Math.min(100, (userProgress / target) * 100);
  
  // Verificar status do desafio
  const now = new Date();
  const startDate = new Date(challenge.start_date);
  const endDate = new Date(challenge.end_date);
  
  const isActive = now >= startDate && now <= endDate;
  const isPending = now < startDate;
  const isCompleted = now > endDate;
  
  // Calcular dias restantes
  const daysRemaining = isActive ? 
    Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : 0;
  
  // Calcular dias até o início
  const daysUntilStart = isPending ?
    Math.ceil((startDate - now) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="p-4">
      {/* Status Banner */}
      {isPending && (
        <div className="bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-30 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0 py-1 mr-4">
              <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Desafio ainda não iniciado</p>
              <p className="text-sm">Começa em {daysUntilStart} {daysUntilStart === 1 ? 'dia' : 'dias'} ({startDate.toLocaleDateString()})</p>
            </div>
          </div>
        </div>
      )}
      
      {isActive && (
        <div className="bg-green-100 dark:bg-green-900 dark:bg-opacity-30 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0 py-1 mr-4">
              <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Desafio em andamento</p>
              <p className="text-sm">Restam {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} ({endDate.toLocaleDateString()})</p>
            </div>
          </div>
        </div>
      )}
      
      {isCompleted && (
        <div className="bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0 py-1 mr-4">
              <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Desafio finalizado</p>
              <p className="text-sm">Encerrado em {endDate.toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Progress Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FontAwesomeIcon icon={faChartLine} className="mr-2 text-green-500" />
          Seu Progresso
        </h2>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span>{userProgress} / {target}</span>
            <span>{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {isActive && (
          <Link 
            to={`/challenge/${challengeId}/checkins`}
            className="block w-full bg-green-500 hover:bg-green-600 text-white text-center py-2 rounded-lg"
          >
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
            Fazer Check-in
          </Link>
        )}
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Participantes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="font-bold flex items-center mb-2">
            <FontAwesomeIcon icon={faUsers} className="mr-2 text-purple-500" />
            Participantes
          </h3>
          <p className="text-3xl font-bold">{participants.length || 0}</p>
          <Link 
            to={`/challenge/${challengeId}/ranking`}
            className="text-blue-500 hover:underline text-sm"
          >
            Ver classificação
          </Link>
        </div>
        
        {/* Total de Check-ins */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="font-bold flex items-center mb-2">
            <FontAwesomeIcon icon={faDumbbell} className="mr-2 text-orange-500" />
            Seu Total
          </h3>
          <p className="text-3xl font-bold">{userProgress}</p>
          <Link 
            to={`/challenge/${challengeId}/history`}
            className="text-blue-500 hover:underline text-sm"
          >
            Ver histórico
          </Link>
        </div>
        
        {/* Dias Restantes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="font-bold flex items-center mb-2">
            <FontAwesomeIcon icon={isActive ? faHistory : isPending ? faHistory : faTrophy} className="mr-2 text-blue-500" />
            {isActive ? "Dias Restantes" : isPending ? "Começa em" : "Finalizado"}
          </h3>
          <p className="text-3xl font-bold">{isActive ? daysRemaining : isPending ? daysUntilStart : "✓"}</p>
        </div>
      </div>
      
      {/* Placeholder para Activity Feed */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Atividade Recente</h2>
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">Carregando atividades...</p>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDashboard;