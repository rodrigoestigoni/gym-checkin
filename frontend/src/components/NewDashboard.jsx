// NewDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faFire, faTrophy, faChartLine, 
  faCheckCircle, faCalendarCheck, faHistory 
} from '@fortawesome/free-solid-svg-icons';

const NewDashboard = ({ user }) => {
  // State variables from both dashboards
  const [weekData, setWeekData] = useState([]);
  const [stats, setStats] = useState({
    totalCheckins: 0,
    streakDays: 0,
    thisWeekCheckins: 0,
    lastWeekCheckins: 0,
    averagePerWeek: 0,
    points: 0,
    ranking: 0
  });
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const MIN_TRAINING_DAYS = 3;

  useEffect(() => {
    if (!user?.id) return;
    
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch data in parallel for better performance
        const [weeklyRes, checkinsRes, rankingRes, challengesRes] = await Promise.all([
          // Weekly checkins
          fetch(`${API_URL}/users/${user.id}/checkins/week/?week_offset=0`, {
            headers: { 
              Authorization: `Bearer ${user.token}`,
              "Cache-Control": "no-cache" 
            }
          }),
          
          // All checkins for stats
          fetch(`${API_URL}/users/${user.id}/checkins/?skip=0&limit=100`, {
            headers: { 
              Authorization: `Bearer ${user.token}`,
              "Cache-Control": "no-cache"
            }
          }),
          
          // Ranking data
          fetch(`${API_URL}/ranking/overall`, { 
            headers: { "Cache-Control": "no-cache" }
          }),
          
          // Active challenges
          fetch(`${API_URL}/challenge-participation/`, {
            headers: { Authorization: `Bearer ${user.token}` }
          })
        ]);
        
        // Process weekly data
        if (weeklyRes.ok) {
          const weeklyData = await weeklyRes.json();
          
          // Process data into days of the week
          const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
          const weekProcessed = days.map((day, index) => {
            const dayCheckins = weeklyData.filter((ci) => {
              const date = new Date(ci.timestamp);
              return date.getDay() === index;
            });
            return { day, checkins: dayCheckins };
          });
          
          setWeekData(weekProcessed);
        }
        
        // Process all checkins for stats
        if (checkinsRes.ok) {
          const allCheckins = await checkinsRes.json();
          
          // Calculate stats
          const totalCheckins = allCheckins.length;
          
          // Weekly checkins
          const today = new Date();
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
          startOfWeek.setHours(0, 0, 0, 0);
          
          const checkinsDaysMap = new Map();
          
          allCheckins.forEach(checkin => {
            const date = new Date(checkin.timestamp);
            const dateString = date.toDateString();
            checkinsDaysMap.set(dateString, true);
          });
          
          const thisWeekCheckins = allCheckins.filter(checkin => 
            new Date(checkin.timestamp) >= startOfWeek
          ).length;
          
          // Last week's checkins
          const startOfLastWeek = new Date(startOfWeek);
          startOfLastWeek.setDate(startOfWeek.getDate() - 7);
          const endOfLastWeek = new Date(startOfWeek);
          endOfLastWeek.setSeconds(endOfLastWeek.getSeconds() - 1);
          
          const lastWeekCheckins = allCheckins.filter(checkin => {
            const date = new Date(checkin.timestamp);
            return date >= startOfLastWeek && date < endOfLastWeek;
          }).length;
          
          // Calculate weekly average
          const weeklyCount = [thisWeekCheckins, lastWeekCheckins];
          
          for (let i = 2; i < 4; i++) {
            const startOfPastWeek = new Date(startOfWeek);
            startOfPastWeek.setDate(startOfWeek.getDate() - (7 * i));
            const endOfPastWeek = new Date(startOfPastWeek);
            endOfPastWeek.setDate(endOfPastWeek.getDate() + 7);
            
            const pastWeekCheckins = allCheckins.filter(checkin => {
              const date = new Date(checkin.timestamp);
              return date >= startOfPastWeek && date < endOfPastWeek;
            }).length;
            
            weeklyCount.push(pastWeekCheckins);
          }
          
          const averagePerWeek = weeklyCount.reduce((sum, count) => sum + count, 0) / weeklyCount.length;
          
          // Calculate streak
          let streakDays = 0;
          let currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0);
          
          const maxLookback = 30;
          
          for (let i = 0; i < maxLookback; i++) {
            const dateString = currentDate.toDateString();
            
            if (checkinsDaysMap.has(dateString)) {
              streakDays++;
              currentDate.setDate(currentDate.getDate() - 1);
            } else {
              break;
            }
          }
          
          setStats({
            totalCheckins,
            thisWeekCheckins,
            lastWeekCheckins,
            averagePerWeek: Math.round(averagePerWeek * 10) / 10,
            streakDays,
            points: user.points || 0,
            ranking: 0 // Will be updated from ranking data
          });
        }
        
        // Process ranking data
        if (rankingRes.ok) {
          const rankingData = await rankingRes.json();
          
          // Find user's ranking position
          let userRanking = 0;
          const foundUser = rankingData.overall?.find(u => u.id === user.id);
          if (foundUser) {
            userRanking = rankingData.overall.indexOf(foundUser) + 1;
            
            // Update stats with ranking info
            setStats(prev => ({
              ...prev,
              ranking: userRanking
            }));
          }
        }
        
        // Process challenge data
        if (challengesRes.ok) {
          const challengeData = await challengesRes.json();
          setActiveChallenges(challengeData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Erro ao carregar dados. Por favor, tente novamente.");
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [user?.id, user?.token, API_URL]);

  if (!user) return <p>Por favor, faça login.</p>;
  
  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900 dark:bg-opacity-20 border border-red-400 text-red-700 dark:text-red-300 rounded mb-4">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded"
        >
          Tentar novamente
        </button>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  // Calculations 
  const totalWeeklyCheckins = weekData.reduce((total, day) => total + day.checkins.length, 0);
  const missing = totalWeeklyCheckins < MIN_TRAINING_DAYS ? MIN_TRAINING_DAYS - totalWeeklyCheckins : 0;
  const trend = stats.thisWeekCheckins - stats.lastWeekCheckins;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link 
          to="/challenges/create" 
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow flex items-center"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Novo Desafio
        </Link>
      </div>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
          <div className="bg-green-100 dark:bg-green-900 dark:bg-opacity-50 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <FontAwesomeIcon icon={faChartLine} className="text-green-600 dark:text-green-400 text-3xl" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Estatísticas</h2>
          <p className="text-2xl font-bold">{stats.totalCheckins}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total de treinos</p>
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
            <Link 
              to="/checkin" 
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Fazer check-in
            </Link>
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
              to="/ranking" 
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center"
            >
              <FontAwesomeIcon icon={faTrophy} className="mr-2" />
              Ver ranking
            </Link>
          </div>
        </div>
      </section>

      {/* Weekly Calendar */}
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

      {/* Active Challenges */}
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
              const progress = challenge.target ? (participant.progress / challenge.target) * 100 : 0;
              
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

      {/* Quick Links */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          to="/checkin"
          className="bg-green-500 hover:bg-green-600 text-white rounded-lg p-4 flex items-center justify-center shadow transition-colors"
        >
          <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
          Novo Check-in
        </Link>
        
        <Link 
          to="/history"
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-4 flex items-center justify-center shadow transition-colors"
        >
          <FontAwesomeIcon icon={faHistory} className="mr-2" />
          Ver Histórico
        </Link>
        
        <Link 
          to="/challenges"
          className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg p-4 flex items-center justify-center shadow transition-colors"
        >
          <FontAwesomeIcon icon={faTrophy} className="mr-2" />
          Todos os Desafios
        </Link>
      </section>
    </div>
  );
};

export default NewDashboard;