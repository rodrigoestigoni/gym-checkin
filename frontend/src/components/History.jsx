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
import { api } from "../services/api";

const History = ({ user }) => {
  const [checkins, setCheckins] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(0);
  const [view, setView] = useState("calendar"); // "calendar" ou "list"
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthCheckins, setMonthCheckins] = useState([]);
  const [selectedCheckins, setSelectedCheckins] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const limit = 10;
  
  const fetchCheckins = async () => {
    if (!user) return;
    
    try {
      const res = await api.getCheckins(user.id, user.token, page * limit, limit);
      if (res.ok) {
        const data = await res.json();
        setCheckins(data);
      }
    } catch (err) {
      console.error("Erro ao buscar checkins:", err);
    }
  };
  
  const fetchMonthCheckins = async () => {
    const [loading, setLoading] = useState(false);
    const [monthDataCache, setMonthDataCache] = useState({});
    if (loading || !user) return;
    const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;

    if (monthDataCache[monthKey]) {
      setMonthCheckins(monthDataCache[monthKey]);
      return;
    }
    
    // Primeiro dia do mês atual
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    // Último dia do mês atual
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    try {
      setLoading(true);

      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:8000"}/users/${user.id}/checkins/?skip=0&limit=100`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        // Filtrar para o mês atual
        const filtered = data.filter(checkin => {
          const checkinDate = new Date(checkin.timestamp);
          return checkinDate >= startDate && checkinDate <= endDate;
        });
        setMonthDataCache(prev => ({
          ...prev,
          [monthKey]: filtered
        }));
        setMonthCheckins(filtered);
      }
    } catch (err) {
      console.error("Erro ao buscar checkins do mês:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckins();
  }, [user, page]);
  
  useEffect(() => {
    fetchMonthCheckins();
  }, [user, currentDate.getFullYear(), currentDate.getMonth()]);
  
  const handleEditSuccess = (updatedCheckin) => {
    if (!updatedCheckin) {
      // Checkin foi excluído
      setCheckins(checkins.filter((ci) => ci.id !== editingId));
      setMonthCheckins(monthCheckins.filter((ci) => ci.id !== editingId));
    } else {
      setCheckins(checkins.map((ci) => (ci.id === updatedCheckin.id ? updatedCheckin : ci)));
      setMonthCheckins(monthCheckins.map((ci) => (ci.id === updatedCheckin.id ? updatedCheckin : ci)));
    }
    setEditingId(null);
    setSelectedDay(null);
    setSelectedCheckins([]);
  };

  const handleDeleteCheckin = async (checkinId) => {
    if (window.confirm("Tem certeza que deseja excluir este checkin?")) {
      try {
        const res = await api.deleteCheckin(user.token, checkinId);
        if (res.ok) {
          setCheckins(checkins.filter((ci) => ci.id !== checkinId));
          setMonthCheckins(monthCheckins.filter((ci) => ci.id !== checkinId));
          
          if (selectedDay) {
            setSelectedCheckins(prevSelectedCheckins => 
              prevSelectedCheckins.filter(ci => ci.id !== checkinId)
            );
          }
        } else {
          console.error("Erro ao excluir checkin");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };
  
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
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
    setSelectedCheckins([]);
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
    setSelectedCheckins([]);
  };
  
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    
    // Create empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border bg-gray-100 dark:bg-gray-800 opacity-50"></div>);
    }
    
    // Populate days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayCheckins = monthCheckins.filter(checkin => {
        const checkinDate = new Date(checkin.timestamp);
        return checkinDate.getDate() === day;
      });
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`h-24 border p-1 relative cursor-pointer transition-colors hover:bg-green-50 dark:hover:bg-green-900 
                      ${selectedDay === day ? 'bg-green-100 dark:bg-green-800' : 'bg-white dark:bg-gray-700'}`}
          onClick={() => {
            setSelectedDay(day);
            setSelectedCheckins(dayCheckins);
          }}
        >
          <div className="absolute top-1 left-1 font-bold">{day}</div>
          {dayCheckins.length > 0 && (
            <div className="absolute top-1 right-1 flex items-center">
              <FontAwesomeIcon icon={faDumbbell} className="text-green-500" />
              <span className="ml-1 text-xs font-bold text-green-600 dark:text-green-400">{dayCheckins.length}</span>
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
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
      
      {view === "calendar" ? (
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
            {checkins.map((ci) => (
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
          
          {checkins.length === limit && (
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
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
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