// frontend/src/components/History.jsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faChevronRight, 
  faDumbbell, 
  faListUl, 
  faCalendarAlt,
  faEdit,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import EditCheckinForm from "./EditCheckinForm";

const History = ({ user }) => {
  // Uma única fonte de dados para evitar múltiplas chamadas
  const [allCheckins, setAllCheckins] = useState([]);
  
  // Estados de UI
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(0);
  const [view, setView] = useState("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedCheckins, setSelectedCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const limit = 10;
  
  // Contador para evitar chamadas infinitas - apenas para debug
  const [fetchCounter, setFetchCounter] = useState(0);

  // Função para buscar dados - será chamada UMA ÚNICA VEZ
  useEffect(() => {
    if (!user?.id) return;
    
    // Flag para limpeza
    let isActive = true;
    let controller = new AbortController();
    
    const fetchAllData = async () => {
      if (fetchCounter > 0) {
        console.log("Evitando chamada adicional - fetchCounter:", fetchCounter);
        return;
      }
      
      try {
        setLoading(true);
        setFetchCounter(prev => prev + 1);
        
        // Usar uma URL constante
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
        
        // Usar fetch diretamente com controle de cache
        const response = await fetch(
          `${API_URL}/users/${user.id}/checkins/?skip=0&limit=100`, 
          {
            headers: { 
              Authorization: `Bearer ${user.token}`,
              "Cache-Control": "no-cache"  
            },
            signal: controller.signal
          }
        );
        
        if (!response.ok) throw new Error("Failed to fetch data");
        
        const data = await response.json();
        
        // Apenas atualiza se o componente ainda estiver montado
        if (isActive) {
          console.log("Dados buscados com sucesso, total:", data.length);
          setAllCheckins(data);
          setLoading(false);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Erro ao buscar dados:", err);
          if (isActive) setLoading(false);
        }
      }
    };
    
    fetchAllData();
    
    // Função de limpeza
    return () => {
      console.log("Limpando recursos do History");
      isActive = false;
      controller.abort();
    };
  }, [user?.id]); // APENAS user.id como dependência
  
  // Funções derivadas de dados calculadas a partir de allCheckins
  const getPagedCheckins = () => {
    const start = page * limit;
    const end = start + limit;
    return allCheckins.slice(start, end);
  };
  
  const getMonthCheckins = () => {
    // Primeiro dia do mês atual
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    // Último dia do mês atual
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
    
    return allCheckins.filter(checkin => {
      const checkinDate = new Date(checkin.timestamp);
      return checkinDate >= startDate && checkinDate <= endDate;
    });
  };
  
  // Handler para edição/deleção - atualiza o estado principal
  const handleEditSuccess = (updatedCheckin) => {
    if (!updatedCheckin) {
      // Checkin foi excluído
      setAllCheckins(prevCheckins => 
        prevCheckins.filter(ci => ci.id !== editingId)
      );
    } else {
      // Checkin foi atualizado
      setAllCheckins(prevCheckins => 
        prevCheckins.map(ci => ci.id === updatedCheckin.id ? updatedCheckin : ci)
      );
    }
    
    setEditingId(null);
    setSelectedDay(null);
    setSelectedCheckins([]);
  };

  const handleDeleteCheckin = async (checkinId) => {
    if (!window.confirm("Tem certeza que deseja excluir este checkin?")) return;
    
    try {
      // Usar o fetch diretamente para maior controle
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/checkins/${checkinId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      
      if (response.ok) {
        // Atualiza o estado local sem fazer nova requisição
        setAllCheckins(prevCheckins => 
          prevCheckins.filter(ci => ci.id !== checkinId)
        );
        
        // Limpa seleção se necessário
        if (selectedDay) {
          setSelectedCheckins(prevSelected => 
            prevSelected.filter(ci => ci.id !== checkinId)
          );
        }
      } else {
        console.error("Erro ao excluir checkin:", response.statusText);
        alert("Erro ao excluir checkin. Tente novamente.");
      }
    } catch (err) {
      console.error("Erro ao excluir checkin:", err);
      alert("Erro ao excluir checkin. Tente novamente.");
    }
  };
  
  // Funções auxiliares do calendário
  const getMonthName = (date) => {
    return date.toLocaleString('default', { month: 'long' });
  };
  
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const prevMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
    setSelectedDay(null);
    setSelectedCheckins([]);
  };
  
  const nextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
    setSelectedDay(null);
    setSelectedCheckins([]);
  };
  
  // Seleção de dia no calendário
  const handleDayClick = (day) => {
    const dayCheckins = getMonthCheckins().filter(checkin => {
      const checkinDate = new Date(checkin.timestamp);
      return checkinDate.getDate() === day;
    });
    
    setSelectedDay(day);
    setSelectedCheckins(dayCheckins);
  };
  
  // Renderiza calendário - derivado de dados, não estado
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const monthCheckins = getMonthCheckins();
    const days = [];
    
    // Create empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border bg-gray-100 dark:bg-gray-800 opacity-50"></div>);
    }
    
    // Populate days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayCheckins = monthCheckins.filter(checkin => {
        const checkinDate = new Date(checkin.timestamp);
        return checkinDate.getDate() === day;
      });
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`h-24 border p-1 relative cursor-pointer transition-colors hover:bg-green-50 dark:hover:bg-green-900 
                      ${selectedDay === day ? 'bg-green-100 dark:bg-green-800' : 'bg-white dark:bg-gray-700'}`}
          onClick={() => handleDayClick(day)}
        >
          <div className="absolute top-1 left-1 font-bold">{day}</div>
          {dayCheckins.length > 0 && (
            <div className="absolute bottom-1 right-1 sm:top-1 sm:right-1 flex items-center">
              <FontAwesomeIcon icon={faDumbbell} className="text-green-500" />
              <span className="ml-1 text-xs font-bold text-green-600 dark:text-green-400">{dayCheckins.length}</span>
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };
  
  if (!user) return <p>Por favor, faça login.</p>;
  
  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold">Histórico de Checkins</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setView("calendar")} 
            className={`px-3 py-1 rounded flex items-center ${
              view === "calendar" ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
            Calendário
          </button>
          <button 
            onClick={() => setView("list")} 
            className={`px-3 py-1 rounded flex items-center ${
              view === "list" ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            <FontAwesomeIcon icon={faListUl} className="mr-1" />
            Lista
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center p-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mb-2"></div>
          <p>Carregando dados...</p>
        </div>
      ) : view === "calendar" ? (
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={prevMonth}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <h2 className="text-xl font-bold">
              {getMonthName(currentDate)} {currentDate.getFullYear()}
            </h2>
            <button 
              onClick={nextMonth}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-4 font-bold text-center">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
          
          {selectedDay && (
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-2">
                Checkins em {selectedDay}/{currentDate.getMonth()+1}/{currentDate.getFullYear()}
              </h3>
              
              {selectedCheckins.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Nenhum checkin neste dia.</p>
              ) : (
                <div className="space-y-2">
                  {selectedCheckins.map((ci) => (
                    <div key={ci.id} className="border p-3 rounded bg-white dark:bg-gray-700 shadow">
                      {editingId === ci.id ? (
                        <EditCheckinForm 
                          checkin={ci} 
                          user={user} 
                          onSuccess={handleEditSuccess}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold">{new Date(ci.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            {ci.duration && <p>Duração: {ci.duration} minutos</p>}
                            {ci.description && <p>Descrição: {ci.description}</p>}
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => setEditingId(ci.id)}
                              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                              title="Editar"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button 
                              onClick={() => handleDeleteCheckin(ci.id)}
                              className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                              title="Excluir"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
          <ul className="space-y-2">
            {getPagedCheckins().map((ci) => (
              <li key={ci.id} className="border p-3 rounded bg-white dark:bg-gray-700 shadow">
                {editingId === ci.id ? (
                  <EditCheckinForm 
                    checkin={ci} 
                    user={user} 
                    onSuccess={handleEditSuccess}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">{new Date(ci.timestamp).toLocaleString()}</p>
                      {ci.duration && <p>Duração: {ci.duration} minutos</p>}
                      {ci.description && <p>Descrição: {ci.description}</p>}
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setEditingId(ci.id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteCheckin(ci.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
          
          {allCheckins.length > limit && (
            <div className="flex justify-between mt-4">
              <button 
                disabled={page === 0} 
                onClick={() => setPage(page - 1)} 
                className={`px-4 py-2 rounded ${
                  page === 0 
                    ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' 
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              >
                Anterior
              </button>
              <button 
                onClick={() => setPage(page + 1)} 
                disabled={(page + 1) * limit >= allCheckins.length}
                className={`px-4 py-2 rounded ${
                  (page + 1) * limit >= allCheckins.length
                    ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' 
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              >
                Próximo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default History;