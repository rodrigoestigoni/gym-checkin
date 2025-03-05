import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDumbbell, 
  faSignOutAlt, 
  faUserCog, 
  faUser, 
  faBars, 
  faTimes,
  faTrophy
} from '@fortawesome/free-solid-svg-icons';

const Header = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [showChallengesDropdown, setShowChallengesDropdown] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  // Buscar desafios ativos quando o usuário estiver logado
  useEffect(() => {
    if (user?.token) {
      fetch(`${API_URL}/challenge-participation/`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
        .then(res => res.json())
        .then(data => {
          // Filtrar desafios ativos (data atual entre start_date e end_date)
          const now = new Date();
          const active = data.filter(item => {
            const startDate = new Date(item.challenge.start_date);
            const endDate = new Date(item.challenge.end_date);
            return now >= startDate && now <= endDate && item.participant.approved;
          });
          setActiveChallenges(active);
        })
        .catch(err => console.error("Erro ao buscar desafios ativos:", err));
    }
  }, [user, API_URL]);

  const handleLogout = () => {
    // Limpa localStorage e o estado do usuário
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="bg-white dark:bg-gray-800 dark:text-white shadow">
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* Área esquerda: botão mobile (apenas em telas pequenas) */}
        <div className="flex md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-700 focus:outline-none mr-2">
            {menuOpen ? <FontAwesomeIcon icon={faTimes} size="lg" /> : <FontAwesomeIcon icon={faBars} size="lg" />}
          </button>
        </div>

        {/* Área central: Título */}
        <div className="flex-1 text-center">
          <Link to="/" className="flex items-center justify-center">
            <FontAwesomeIcon icon={faDumbbell} className="text-green-500 mr-2" size="2x" />
            <span className="text-xl font-bold">Shape 2025</span>
          </Link>
        </div>

        {/* Área direita: Itens do menu para desktop */}
        <div className="hidden md:flex md:items-center md:space-x-4">
          {user ? (
            <>
              {/* Dropdown para Desafios Ativos */}
              <div className="relative">
                <button 
                  onClick={() => setShowChallengesDropdown(!showChallengesDropdown)}
                  className="flex items-center hover:text-green-500"
                >
                  <FontAwesomeIcon icon={faTrophy} className="mr-1" />
                  Desafios
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showChallengesDropdown && (
                  <div className="absolute right-0 mt-2 py-2 w-64 bg-white dark:bg-gray-700 rounded-md shadow-xl z-20">
                    <Link 
                      to="/challenges"
                      className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => setShowChallengesDropdown(false)}
                    >
                      Todos os Desafios
                    </Link>
                    <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                    
                    {activeChallenges.length > 0 ? (
                      <>
                        <div className="px-4 py-1 text-xs text-gray-500 dark:text-gray-400">
                          Desafios Ativos:
                        </div>
                        {activeChallenges.map(item => (
                          <Link 
                            key={item.challenge.id}
                            to={`/challenge/${item.challenge.id}/dashboard`}
                            className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                            onClick={() => setShowChallengesDropdown(false)}
                          >
                            {item.challenge.title}
                          </Link>
                        ))}
                        <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                      </>
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                        Nenhum desafio ativo
                      </div>
                    )}
                    
                    <Link 
                      to="/challenges/create"
                      className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => setShowChallengesDropdown(false)}
                    >
                      + Criar Novo Desafio
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/dashboard" className="hover:text-green-500">Dashboard</Link>
              <Link to="/history" className="hover:text-green-500">Histórico</Link>
              <Link to="/ranking" className="hover:text-green-500">Ranking</Link>
              
              {user.is_admin && (
                <Link to="/admin" className="hover:text-green-500 flex items-center">
                  <FontAwesomeIcon icon={faUserCog} className="mr-1" />
                  Admin
                </Link>
              )}
              <Link to="/profile" className="hover:text-green-500 flex items-center">
                {user.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt="perfil"
                    className="h-10 w-10 rounded-full object-cover mr-1"
                  />
                ) : (
                  <FontAwesomeIcon icon={faUser} className="mr-1" size="lg" />
                )}
                Perfil
              </Link>
              <button onClick={handleLogout} className="flex items-center hover:text-red-500">
                <FontAwesomeIcon icon={faSignOutAlt} className="mr-1" />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-green-500">Login</Link>
              <Link to="/register" className="hover:text-green-500">Registrar</Link>
            </>
          )}
        </div>
      </div>
      {/* Menu mobile: aparece quando menuOpen=true */}
      {menuOpen && (
        <nav className="md:hidden bg-white dark:bg-gray-800 shadow">
          <ul className="flex flex-col space-y-2 p-4">
            {user ? (
              <>
                <li>
                  <Link onClick={() => setMenuOpen(false)} to="/dashboard" className="block hover:text-green-500">Dashboard</Link>
                </li>
                <li>
                  <Link onClick={() => setMenuOpen(false)} to="/history" className="block hover:text-green-500">Histórico</Link>
                </li>
                <li>
                  <Link onClick={() => setMenuOpen(false)} to="/ranking" className="block hover:text-green-500">Ranking</Link>
                </li>
                <li>
                  <Link onClick={() => setMenuOpen(false)} to="/challenges" className="block hover:text-green-500">Desafios</Link>
                </li>
                
                {/* Desafios Ativos no menu mobile */}
                {activeChallenges.length > 0 && (
                  <li className="pl-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Desafios Ativos:</span>
                    <ul className="pl-2 mt-1 space-y-1">
                      {activeChallenges.map(item => (
                        <li key={item.challenge.id}>
                          <Link 
                            to={`/challenge/${item.challenge.id}/dashboard`}
                            className="block text-sm hover:text-green-500"
                            onClick={() => setMenuOpen(false)}
                          >
                            - {item.challenge.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                )}
                
                {user.is_admin && (
                  <li>
                    <Link onClick={() => setMenuOpen(false)} to="/admin" className="block hover:text-green-500">
                      <FontAwesomeIcon icon={faUserCog} className="mr-1" />
                      Admin
                    </Link>
                  </li>
                )}
                <li>
                  <Link onClick={() => setMenuOpen(false)} to="/profile" className="block hover:text-green-500 flex items-center">
                    <FontAwesomeIcon icon={faUser} className="mr-1" />
                    Perfil
                  </Link>
                </li>
                <li>
                  <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="w-full text-left hover:text-red-500 flex items-center">
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-1" />
                    Sair
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link onClick={() => setMenuOpen(false)} to="/login" className="block hover:text-green-500">Login</Link>
                </li>
                <li>
                  <Link onClick={() => setMenuOpen(false)} to="/register" className="block hover:text-green-500">Registrar</Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Header;