// EnhancedHistory.jsx
import React, { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faChevronRight, 
  faDumbbell, 
  faListUl, 
  faCalendarAlt,
  faEdit,
  faTrash,
  faHistory,
  faExclamationTriangle,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import EditCheckinForm from "./EditCheckinForm";

const EnhancedHistory = ({ user, challengeId = null }) => {
  // Main data store
  const [allCheckins, setAllCheckins] = useState([]);
  
  // UI states
  const [editingId, setEditingId] = useState(null);
  const [view, setView] = useState("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedCheckins, setSelectedCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [challenge, setChallenge] = useState(null);
  const effectRan = useRef(false);
  const limit = 10;
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (effectRan.current) return;
    if (!user?.id) return;
    
    let isActive = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Fetching history data...");
        
        // First, fetch all check-ins
        const checkinsRes = await fetch(`${API_URL}/users/${user.id}/checkins/?skip=0&limit=100`, {
          headers: { 
            Authorization: `Bearer ${user.token}`,
            "Cache-Control": "no-cache"
          }
        });
        
        if (!checkinsRes.ok) {
          throw new Error(`Failed to fetch check-ins: ${checkinsRes.status}`);
        }
        
        const checkinsData = await checkinsRes.json();
        console.log(`Fetched ${checkinsData.length} check-ins`);
        
        if (!isActive) return;
        
        // Filter check-ins by challenge_id if we have a challengeId
        if (challengeId) {
          console.log(`Filtering for challenge ${challengeId}`);
          const filteredCheckins = checkinsData.filter(checkin => 
            // Try to parse challengeId as a number for safer comparison
            checkin.challenge_id === parseInt(challengeId)
          );
          console.log(`Found ${filteredCheckins.length} check-ins for this challenge`);
          setAllCheckins(filteredCheckins);
        } else {
          // No challenge filter, show all check-ins
          setAllCheckins(checkinsData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching history data:", err);
        if (isActive) {
          setError("Erro ao carregar dados. Por favor, tente novamente.");
          setLoading(false);
        }
      }
    };
    
    fetchData();
    effectRan.current = true;
    
    return () => {
      isActive = false;
    };
  }, [user?.id, user?.token, challengeId, API_URL]);

  // Edit/update handlers
  const handleEditSuccess = (updatedCheckin) => {
    if (!updatedCheckin) {
      // Checkin was deleted
      setAllCheckins(prev => prev.filter(ci => ci.id !== editingId));
    } else {
      // Checkin was updated
      setAllCheckins(prev => prev.map(ci => ci.id === updatedCheckin.id ? updatedCheckin : ci));
    }
    
    setEditingId(null);
    
    // Update selected day's checkins if necessary
    if (selectedDay) {
      const updatedDayCheckins = getMonthCheckins().filter(checkin => {
        const checkinDate = new Date(checkin.timestamp);
        return checkinDate.getDate() === selectedDay;
      });
      setSelectedCheckins(updatedDayCheckins);
    }
  };

  const handleDeleteCheckin = async (checkinId) => {
    if (!window.confirm("Tem certeza que deseja excluir este check-in?")) return;
    
    try {
      const response = await fetch(`${API_URL}/checkins/${checkinId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      if (response.ok) {
        // Update state locally without fetching again
        setAllCheckins(prev => prev.filter(ci => ci.id !== checkinId));
        
        // Update selected day's checkins if necessary
        if (selectedDay) {
          setSelectedCheckins(prev => prev.filter(ci => ci.id !== checkinId));
        }
      } else {
        console.error("Error deleting check-in:", response.statusText);
        alert("Erro ao excluir check-in. Tente novamente.");
      }
    } catch (err) {
      console.error("Error deleting check-in:", err);
      alert("Erro ao excluir check-in. Tente novamente.");
    }
  };

  // Calendar helpers
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
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
    setSelectedDay(null);
    setSelectedCheckins([]);
  };
  
  const nextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
    setSelectedDay(null);
    setSelectedCheckins([]);
  };
  
  // Derived data functions
  const getPagedCheckins = () => {
    const start = page * limit;
    const end = start + limit;
    return allCheckins.slice(start, end);
  };
  
  const getMonthCheckins = () => {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
    
    return allCheckins.filter(checkin => {
      const checkinDate = new Date(checkin.timestamp);
      return checkinDate >= startDate && checkinDate <= endDate;
    });
  };
  
  const handleDayClick = (day) => {
    const dayCheckins = getMonthCheckins().filter(checkin => {
      const checkinDate = new Date(checkin.timestamp);
      return checkinDate.getDate() === day;
    });
    
    setSelectedDay(day);
    setSelectedCheckins(dayCheckins);
  };
  
  // Render calendar
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
  
  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900 dark:bg-opacity-20 border border-red-400 text-red-700 dark:text-red-300 rounded mb-4">
        <div className="flex items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
          <p>{error}</p>
        </div>
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
          <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
        <h1 className="text-2xl font-bold flex items-center">
          <FontAwesomeIcon icon={faHistory} className="mr-2 text-blue-500" />
          {challenge ? `Histórico: ${challenge.title}` : 'Histórico de Check-ins'}
        </h1>
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
      
      {view === "calendar" ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
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
                Check-ins em {selectedDay}/{currentDate.getMonth()+1}/{currentDate.getFullYear()}
              </h3>
              
              {selectedCheckins.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Nenhum check-in neste dia.</p>
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          {allCheckins.length === 0 ? (
            <div className="text-center py-10">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 text-4xl mb-4" />
              <p className="text-xl font-bold mb-2">Nenhum check-in encontrado</p>
              <p className="text-gray-500 dark:text-gray-400">
                Comece a registrar seus treinos para ver seu histórico
              </p>
            </div>
          ) : (
            <>
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
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center"
                          >
                            <FontAwesomeIcon icon={faEdit} className="mr-1" />
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDeleteCheckin(ci.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center"
                          >
                            <FontAwesomeIcon icon={faTrash} className="mr-1" />
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
                    <FontAwesomeIcon icon={faChevronLeft} className="mr-1" />
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
                    <FontAwesomeIcon icon={faChevronRight} className="ml-1" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedHistory;