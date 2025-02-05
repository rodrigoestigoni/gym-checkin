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
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* Botão de menu (mobile) */}
        <div className="flex items-center md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-700 focus:outline-none mr-2">
            {menuOpen ? <FontAwesomeIcon icon={faTimes} size="lg" /> : <FontAwesomeIcon icon={faBars} size="lg" />}
          </button>
        </div>
        {/* Título central */}
        <div className="flex-1 text-center md:text-left">
          <Link to="/" className="flex items-center justify-center md:justify-start">
            <FontAwesomeIcon icon={faDumbbell} className="text-green-500 mr-2" size="2x" />
            <span className="text-xl font-bold">Gym CheckIn</span>
          </Link>
        </div>
        {/* Foto de perfil no header (direita) */}
        <div className="hidden md:flex items-center">
          {user && (
            <Link to="/profile" className="flex items-center hover:text-green-500">
              {user.profile_image ? (
                <img
                  src={user.profile_image}
                  alt="perfil"
                  className="h-10 w-10 rounded-full object-cover mr-2"
                />
              ) : (
                <FontAwesomeIcon icon={faUser} className="mr-2" size="lg" />
              )}
              <span>{user.username}</span>
            </Link>
          )}
        </div>
      </div>
      {/* Menu mobile */}
      {menuOpen && (
        <nav className="md:hidden bg-white shadow">
          <ul className="flex flex-col space-y-2 p-4">
            {user ? (
              <>
                <li>
                  <Link onClick={() => setMenuOpen(false)} to="/checkin" className="block hover:text-green-500">
                    Checkin
                  </Link>
                </li>
                <li>
                  <Link onClick={() => setMenuOpen(false)} to="/dashboard" className="block hover:text-green-500">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link onClick={() => setMenuOpen(false)} to="/history" className="block hover:text-green-500">
                    Histórico
                  </Link>
                </li>
                <li>
                  <Link onClick={() => setMenuOpen(false)} to="/ranking" className="block hover:text-green-500">
                    Ranking
                  </Link>
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
                  <Link onClick={() => setMenuOpen(false)} to="/profile" className="block hover:text-green-500">
                    <FontAwesomeIcon icon={faUser} className="mr-1" />
                    Perfil
                  </Link>
                </li>
                <li>
                  <button onClick={handleLogout} className="w-full text-left hover:text-red-500 flex items-center">
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-1" />
                    Sair
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link onClick={() => setMenuOpen(false)} to="/login" className="block hover:text-green-500">
                    Login
                  </Link>
                </li>
                <li>
                  <Link onClick={() => setMenuOpen(false)} to="/register" className="block hover:text-green-500">
                    Registrar
                  </Link>
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
