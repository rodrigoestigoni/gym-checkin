// frontend/src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faTimesCircle, 
  faDumbbell, 
  faChartLine, 
  faCalendarCheck, 
  faTrophy,
  faHistory,
  faPlus,
  faFire
} from '@fortawesome/free-solid-svg-icons';
import { api } from "../services/api";

const Dashboard = ({ user }) => {
  const [weeklyCheckins, setWeeklyCheckins] = useState([]);
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
  const MIN_TRAINING_DAYS = 3;

  useEffect(() => {
    const [loading, setLoading] = useState(false);

    if (loading || !user) return;
    
    const fetchCheckins = async () => {
      try {
        const res = await api.getWeeklyCheckins(user.id, user.token);
        if (res.ok) {
          const data = await res.json();
          setWeeklyCheckins(data);
        }
      } catch (err) {
        console.error("Erro ao buscar checkins:", err);
      }
    };

    const fetchStats = async () => {
      try {
        setLoading(true);
        const allCheckinsRes = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:8000"}/users/${user.id}/checkins/?skip=0&limit=100`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        
        if (allCheckinsRes.ok) {
          const allCheckins = await allCheckinsRes.json();
          
          // Buscar o ranking
          const rankingRes = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:8000"}/ranking/overall`);
          let userRanking = 0;
          
          if (rankingRes.ok) {
            const rankingData = await rankingRes.json();
            const foundUser = rankingData.overall?.find(u => u.id === user.id);
            userRanking = foundUser ? rankingData.overall.indexOf(foundUser) + 1 : 0;
          }
          
          // Calcular estatísticas
          // 1. Total de checkins
          const totalCheckins = allCheckins.length;
          
          // 2. Checkins desta semana
          const today = new Date();
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Primeiro dia da semana (Domingo)
          startOfWeek.setHours(0, 0, 0, 0);
          
          const checkinsDaysMap = new Map(); // Para calcular sequências
          
          allCheckins.forEach(checkin => {
            const date = new Date(checkin.timestamp);
            const dateString = date.toDateString();
            checkinsDaysMap.set(dateString, true);
          });
          
          const thisWeekCheckins = allCheckins.filter(checkin => 
            new Date(checkin.timestamp) >= startOfWeek
          ).length;
          
          // 3. Checkins da semana passada
          const startOfLastWeek = new Date(startOfWeek);
          startOfLastWeek.setDate(startOfWeek.getDate() - 7);
          const endOfLastWeek = new Date(startOfWeek);
          endOfLastWeek.setSeconds(endOfLastWeek.getSeconds() - 1);
          
          const lastWeekCheckins = allCheckins.filter(checkin => {
            const date = new Date(checkin.timestamp);
            return date >= startOfLastWeek && date < endOfLastWeek;
          }).length;
          
          // 4. Média por semana (últimas 4 semanas)
          let weeklyCount = [thisWeekCheckins, lastWeekCheckins];
          
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
          
          // 5. Calcular sequência atual
          let streakDays = 0;
          let currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0);
          
          // Verificar até 30 dias atrás no máximo
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
            averagePerWeek,
            streakDays,
            points: user.points,
            ranking: userRanking
          });
        }
      } catch (err) {
        console.error("Erro ao calcular estatísticas:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCheckins();
    fetchStats();
  }, [user]);

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
  
  // Calcular a tendência (em relação à semana passada)
  const trend = stats.thisWeekCheckins - stats.lastWeekCheckins;
  
  if (!user) return <p>Por favor, faça login.</p>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Dashboard</h1>
      
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
              <FontAwesomeIcon icon={trend >= 0 ? faChartLine : faChartLine} className="ml-1" />
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
      </div>
      
      {/* Resumo da semana */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FontAwesomeIcon icon={faCalendarCheck} className="mr-2 text-green-500" />
          Minha Semana
        </h2>
        
        <div className="grid grid-cols-7 gap-2 mb-4">
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
                  <FontAwesomeIcon icon={faTimesCircle} className="text-gray-400 dark:text-gray-500 text-xl" />
                </div>
              )}
              <div className="mt-2 text-xs font-medium">
                {item.checkins.length} treino{item.checkins.length !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center p-4 mt-4 rounded-lg bg-gray-50 dark:bg-gray-700">
          {totalCheckins < MIN_TRAINING_DAYS ? (
            <div className="flex flex-col items-center">
              <p className="text-xl text-orange-600 dark:text-orange-400 mb-2">
                Faltam {missing} treino{missing > 1 ? 's' : ''} para atingir o mínimo da semana!
              </p>
              <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-4 mt-2">
                <div 
                  className="bg-orange-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${(totalCheckins / MIN_TRAINING_DAYS) * 100}%` }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {totalCheckins} de {MIN_TRAINING_DAYS} treinos completados
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
                {totalCheckins} de {MIN_TRAINING_DAYS} treinos completados
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Links rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          to="/checkin"
          className="bg-green-500 hover:bg-green-600 text-white rounded-lg p-4 flex items-center justify-center shadow transition-colors"
        >
          <FontAwesomeIcon icon={faDumbbell} className="mr-2" />
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
          Desafios
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;