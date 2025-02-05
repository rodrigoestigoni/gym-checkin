import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDumbbell, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

const Header = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <Link to="/" className="flex items-center">
        <FontAwesomeIcon icon={faDumbbell} className="text-green-500 mr-2" size="2x" />
        <span className="text-xl font-bold">Gym CheckIn</span>
      </Link>
      <nav className="flex items-center space-x-4">
        {user ? (
          <>
            <Link to="/checkin" className="hover:text-green-500">Checkin</Link>
            <Link to="/dashboard" className="hover:text-green-500">Dashboard</Link>
            <Link to="/history" className="hover:text-green-500">Histórico</Link>
            <Link to="/ranking" className="hover:text-green-500">Ranking</Link>
            <button onClick={handleLogout} className="flex items-center hover:text-red-500">
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-1" />
              Sair
            </button>
          </>
        ) : (
          <Link to="/login" className="hover:text-green-500">Login</Link>
        )}
      </nav>
    </header>
  );
};

export default Header;
