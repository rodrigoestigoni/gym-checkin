import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDumbbell, faSignOutAlt, faUserCog, faUser, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

const Header = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="bg-white shadow p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <FontAwesomeIcon icon={faDumbbell} className="text-green-500 mr-2" size="2x" />
          <span className="text-xl font-bold">Gym CheckIn</span>
        </Link>
        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-700 focus:outline-none">
            {menuOpen ? (
              <FontAwesomeIcon icon={faTimes} size="lg" />
            ) : (
              <FontAwesomeIcon icon={faBars} size="lg" />
            )}
          </button>
        </div>
        <nav className={`md:flex md:items-center md:space-x-4 ${menuOpen ? "block" : "hidden"}`}>
          {user ? (
            <>
              <Link to="/checkin" className="block py-2 hover:text-green-500">Checkin</Link>
              <Link to="/dashboard" className="block py-2 hover:text-green-500">Dashboard</Link>
              <Link to="/history" className="block py-2 hover:text-green-500">Histórico</Link>
              <Link to="/ranking" className="block py-2 hover:text-green-500">Ranking</Link>
              {user.is_admin && (
                <Link to="/admin" className="block py-2 hover:text-green-500">
                  <FontAwesomeIcon icon={faUserCog} className="mr-1" />
                  Admin
                </Link>
              )}
              <Link to="/profile" className="block py-2 hover:text-green-500 flex items-center">
                {user.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt="perfil"
                    className="h-8 w-8 rounded-full mr-1 object-cover"
                  />
                ) : (
                  <FontAwesomeIcon icon={faUser} className="mr-1" />
                )}
                Perfil
              </Link>
              <button onClick={handleLogout} className="block py-2 hover:text-red-500 flex items-center">
                <FontAwesomeIcon icon={faSignOutAlt} className="mr-1" />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block py-2 hover:text-green-500">Login</Link>
              <Link to="/register" className="block py-2 hover:text-green-500">Registrar</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
