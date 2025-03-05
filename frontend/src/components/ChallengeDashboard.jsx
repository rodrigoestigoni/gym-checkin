// ChallengeDashboard.jsx - Atualizado para seguir o estilo do NewDashboard
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faChartLine, 
  faUsers, 
  faDumbbell, 
  faTrophy, 
  faHistory,
  faFire,
  faCalendarCheck,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import { useChallenge } from '../contexts/ChallengeContext';
import RecentActivityFeed from "./RecentActivityFeed";

const ChallengeDashboard = ({ user }) => {
  const { challengeId } = useParams();
  const { activeChallenge, setActiveChallenge } = useChallenge();
  const [challengeData, setChallengeData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [userProgress, setUserProgress] = useState(0);
  const [weekData, setWeekData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalCheckins: 0,
    streakDays: 0,
    thisWeekCheckins: 0,
    lastWeekCheckins: 0,
    averagePerWeek: 0,
    points: 0,
    ranking: 0
  });
  const effectRan = useRef(false);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const MIN_TRAINING_DAYS = 3; // Mínimo de dias de treino

  // UseEffect com controle correto para evitar loops infinitos
  useEffect(() => {
    // Prevenindo múltiplas execuções no modo estrito do React
    if (effectRan.current) return;
    
    let isMounted = true; // Flag para verificar se o componente ainda está montado
    
    const fetchData = async () => {
      if (!challengeId || !user?.token) return;
      
      try {
        console.log("Iniciando requisição para o desafio:", challengeId);
        
        // Buscar desafio
        const challengeRes = await fetch(`${API_URL}/challenges/${challengeId}`, {
          headers: { 
            Authorization: `Bearer ${user.token}`,
            "Cache-Control": "no-cache"
          },
        });
        
        if (!isMounted) return; // Evita atualizar o estado se o componente foi desmontado
        
        if (challengeRes.ok) {
          const challenge = await challengeRes.json();
          console.log("Dados do desafio recebidos:", challenge);
          setChallengeData(challenge);
          
          if (isMounted) {
            setActiveChallenge(challenge);
          }
          
          // Continuar com outras requisições depois que temos o desafio
          try {
            // Buscar os participantes do desafio
            const participantsRes = await fetch(`${API_URL}/challenges/${challengeId}/participants`, {
              headers: { 
                Authorization: `Bearer ${user.token}`,
                "Cache-Control": "no-cache"
              },
            });
            
            if (!isMounted) return;
            
            if (participantsRes.ok) {
              const participantsData = await participantsRes.json();
              console.log("Participantes:", participantsData);
              setParticipants(participantsData);
            }
            
            // Buscar check-ins do usuário para este desafio específico
            const checkinsRes = await fetch(`${API_URL}/users/${user.id}/checkins/?skip=0&limit=100`, {
              headers: { 
                Authorization: `Bearer ${user.token}`,
                "Cache-Control": "no-cache"
              },
            });
            
            if (!isMounted) return;
            
            if (checkinsRes.ok) {
              const checkinsData = await checkinsRes.json();
              
              // Filtramos checkins para este desafio específico
              // Como os checkins podem não ter o challenge_id definido corretamente,
              // podemos filtrar pelo período do desafio
              const startDate = new Date(challenge.start_date);
              const endDate = new Date(challenge.end_date);
              
              const filteredCheckins = checkinsData.filter(checkin => {
                const checkinDate = new Date(checkin.timestamp);
                return (checkin.challenge_id === parseInt(challengeId) || 
                       (checkinDate >= startDate && checkinDate <= endDate));
              });
              
              // Processar dados para estatísticas
              const totalCheckins = filteredCheckins.length;
              setUserProgress(totalCheckins);
              
              // Processamento de dados semanais
              const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
              const today = new Date();
              const weekStart = new Date(today);
              weekStart.setDate(today.getDate() - today.getDay()); // Domingo
              weekStart.setHours(0, 0, 0, 0);
              
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);
              weekEnd.setHours(23, 59, 59, 999);
              
              // Filtrar checkins desta semana
              const thisWeekCheckins = filteredCheckins.filter(checkin => {
                const checkinDate = new Date(checkin.timestamp);
                return checkinDate >= weekStart && checkinDate <= weekEnd;
              });
              
              // Construir dados da semana
              const weekProcessed = days.map((day, index) => {
                const dayCheckins = thisWeekCheckins.filter(checkin => {
                  const checkinDate = new Date(checkin.timestamp);
                  return checkinDate.getDay() === index;
                });
                return { day, checkins: dayCheckins };
              });
              
              setWeekData(weekProcessed);
              
              // Calcular checkins da semana anterior
              const lastWeekStart = new Date(weekStart);
              lastWeekStart.setDate(lastWeekStart.getDate() - 7);
              const lastWeekEnd = new Date(lastWeekStart);
              lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
              lastWeekEnd.setHours(23, 59, 59, 999);
              
              const lastWeekCheckins = filteredCheckins.filter(checkin => {
                const checkinDate = new Date(checkin.timestamp);
                return checkinDate >= lastWeekStart && checkinDate <= lastWeekEnd;
              });
              
              // Calcular sequência atual
              let streakDays = 0;
              let currentDate = new Date();
              currentDate.setHours(0, 0, 0, 0);
              
              const maxLookback = 30;
              const checkinDaysMap = new Map();
              
              filteredCheckins.forEach(checkin => {
                const date = new Date(checkin.timestamp);
                const dateString = date.toDateString();
                checkinDaysMap.set(dateString, true);
              });
              
              for (let i = 0; i < maxLookback; i++) {
                const dateString = currentDate.toDateString();
                
                if (checkinDaysMap.has(dateString)) {
                  streakDays++;
                  currentDate.setDate(currentDate.getDate() - 1);
                } else {
                  break;
                }
              }
              
              // Atualizar estatísticas
              setStats({
                totalCheckins,
                streakDays,
                thisWeekCheckins: thisWeekCheckins.length,
                lastWeekCheckins: lastWeekCheckins.length,
                averagePerWeek: Math.round((thisWeekCheckins.length + lastWeekCheckins.length) / 2),
                points: 0, // Será atualizado depois
                ranking: 0  // Será atualizado depois
              });
              
              // Buscar ranking para atualizar posição do usuário
              if (challenge) {
                const rankingRes = await fetch(`${API_URL}/challenges/${challengeId}/ranking?period=overall`, {
                  headers: { Authorization: `Bearer ${user.token}` }
                });
                
                if (rankingRes.ok) {
                  const rankingData = await rankingRes.json();
                  const combinedRanking = [...(rankingData.podium || []), ...(rankingData.others || [])];
                  const userRank = combinedRanking.findIndex(item => item.id === user.id) + 1;
                  const userPoints = combinedRanking.find(item => item.id === user.id)?.challenge_points || 0;
                  
                  setStats(prevStats => ({
                    ...prevStats,
                    points: userPoints,
                    ranking: userRank > 0 ? userRank : 0
                  }));
                }
              }
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
          setError("Erro ao carregar dados do desafio. Por favor, tente novamente.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          effectRan.current = true;
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
  }, [challengeId, user.id, user.token, setActiveChallenge, API_URL]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Tentar novamente
        </button>
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

  // Calcular números relacionados à semana
  const totalWeeklyCheckins = weekData.reduce((total, day) => total + day.checkins.length, 0);
  const missing = totalWeeklyCheckins < MIN_TRAINING_DAYS ? MIN_TRAINING_DAYS - totalWeeklyCheckins : 0;
  const trend = stats.thisWeekCheckins - stats.lastWeekCheckins;

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

      {/* Stats Cards  */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <div className="bg-green-100 dark:bg-green-900 dark:bg-opacity-50 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <FontAwesomeIcon icon={faChartLine} className="text-green-600 dark:text-green-400 text-3xl" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Estatísticas</h2>
          <p className="text-2xl font-bold">{stats.totalCheckins}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Treinos neste desafio</p>
          <div className="mt-3 flex items-center">
            <div className={`flex items-center ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend >= 0 ? '+' : ''}{trend}
              <FontAwesomeIcon icon={faChartLine} className="ml-1" />
            </div>
            <span className="mx-2 text-gray-500 dark:text-gray-400">vs</span>
            <span>semana passada</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <div className="bg-blue-100 dark:bg-blue-900 dark:bg-opacity-50 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <FontAwesomeIcon icon={faFire} className="text-orange-600 dark:text-orange-400 text-3xl" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Sequência</h2>
          <p className="text-2xl font-bold">{stats.streakDays} dias</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Seu recorde atual</p>
          <div className="mt-3">
            {isActive && (
              <Link 
                to={`/challenge/${challengeId}/checkins`}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Fazer check-in
              </Link>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <div className="bg-purple-100 dark:bg-purple-900 dark:bg-opacity-50 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <FontAwesomeIcon icon={faTrophy} className="text-purple-600 dark:text-purple-400 text-3xl" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Pontuação</h2>
          <p className="text-2xl font-bold">{stats.points} pontos</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {stats.ranking ? `Ranking: ${stats.ranking}º lugar` : 'Ainda sem ranking'}
          </p>
          <div className="mt-3">
            <Link 
              to={`/challenge/${challengeId}/ranking`}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center"
            >
              <FontAwesomeIcon icon={faTrophy} className="mr-2" />
              Ver ranking
            </Link>
          </div>
        </div>
      </section>

      {/* Weekly Calendar - Como no NewDashboard */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FontAwesomeIcon icon={faCalendarCheck} className="mr-2 text-green-500" />
          Minha Semana
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-4">
          {weekData.map((item, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg flex flex-col items-center transition-all ${
                item.checkins.length > 0 
                  ? 'bg-green-100 dark:bg-green-900 dark:bg-opacity-30 shadow-sm' 
                  : 'border dark:border-gray-700'
              }`}
            >
              <div className="font-bold mb-2">{item.day}</div>
              {item.checkins.length > 0 ? (
                <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-white text-xl" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-gray-400 dark:text-gray-500 text-xl" />
                </div>
              )}
              <div className="mt-2 text-xs font-medium">
                {item.checkins.length} treino{item.checkins.length !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center p-4 mt-4 rounded-lg bg-gray-50 dark:bg-gray-700">
          {totalWeeklyCheckins < MIN_TRAINING_DAYS ? (
            <div className="flex flex-col items-center">
              <p className="text-xl text-orange-600 dark:text-orange-400 mb-2">
                Faltam {missing} treino{missing > 1 ? 's' : ''} para atingir o mínimo da semana!
              </p>
              <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-4 mt-2">
                <div 
                  className="bg-orange-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${(totalWeeklyCheckins / MIN_TRAINING_DAYS) * 100}%` }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {totalWeeklyCheckins} de {MIN_TRAINING_DAYS} treinos completados
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <p className="text-xl text-green-600 dark:text-green-400 mb-2 flex items-center">
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                Parabéns! Você completou o mínimo de treinos desta semana!
              </p>
              <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-4 mt-2">
                <div 
                  className="bg-green-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: '100%' }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {totalWeeklyCheckins} de {MIN_TRAINING_DAYS} treinos completados
              </p>
            </div>
          )}
        </div>
      </section>
      
      {/* Progresso do Desafio */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FontAwesomeIcon icon={faChartLine} className="mr-2 text-green-500" />
          Progresso do Desafio
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
        
        {/* Alvo do Desafio */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="font-bold flex items-center mb-2">
            <FontAwesomeIcon icon={faDumbbell} className="mr-2 text-orange-500" />
            Meta do Desafio
          </h3>
          <p className="text-3xl font-bold">{challenge.target}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {challenge.modality === "academia" ? "treinos" : 
             challenge.modality === "corrida" ? "km" : 
             challenge.modality === "passos" ? "passos" : "unidades"}
          </p>
        </div>
        
        {/* Dias Restantes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="font-bold flex items-center mb-2">
            <FontAwesomeIcon icon={isActive ? faHistory : isPending ? faHistory : faTrophy} className="mr-2 text-blue-500" />
            {isActive ? "Dias Restantes" : isPending ? "Começa em" : "Finalizado"}
          </h3>
          <p className="text-3xl font-bold">{isActive ? daysRemaining : isPending ? daysUntilStart : "✓"}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isActive ? `Término: ${endDate.toLocaleDateString()}` : 
             isPending ? `Início: ${startDate.toLocaleDateString()}` : 
             `Finalizado em: ${endDate.toLocaleDateString()}`}
          </p>
        </div>
      </div>
      
      {/* Atividade Recente */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Atividade Recente</h2>
        <RecentActivityFeed challengeId={challengeId} user={user} />
      </div>
    </div>
  );
};

export default ChallengeDashboard;