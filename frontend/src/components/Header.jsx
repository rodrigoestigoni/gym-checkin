import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDumbbell, 
  faSignOutAlt, 
  faUserCog, 
  faUser, 
  faBars, 
  faTimes 
} from '@fortawesome/free-solid-svg-icons';

const Header = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    // Limpa localStorage e o estado do usuário
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="bg-white shadow">
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
              <Link to="/checkin" className="hover:text-green-500">Checkin</Link>
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
        <nav className="md:hidden bg-white shadow">
          <ul className="flex flex-col space-y-2 p-4">
            {user ? (
              <>
                <li>
                  <Link onClick={() => setMenuOpen(false)} to="/checkin" className="block hover:text-green-500">Checkin</Link>
                </li>
                <li>
                  <Link onClick={() => setMenuOpen(false)} to="/dashboard" className="block hover:text-green-500">Dashboard</Link>
                </li>
                <li>
                  <Link onClick={() => setMenuOpen(false)} to="/history" className="block hover:text-green-500">Histórico</Link>
                </li>
                <li>
                  <Link onClick={() => setMenuOpen(false)} to="/ranking" className="block hover:text-green-500">Ranking</Link>
                </li>
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
