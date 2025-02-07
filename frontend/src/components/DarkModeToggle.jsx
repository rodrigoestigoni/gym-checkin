// frontend/src/components/DarkModeToggle.jsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';

const DarkModeToggle = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const storedDark = localStorage.getItem("darkMode");
    if (storedDark === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    console.log("toggleDarkMode chamado, darkMode atual:", darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
      setDarkMode(false);
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:shadow-lg transition-colors duration-300"
      title="Alternar modo"
    >
      {darkMode ? (
        <FontAwesomeIcon icon={faSun} className="text-yellow-400" size="lg" />
      ) : (
        <FontAwesomeIcon icon={faMoon} className="text-gray-800" size="lg" />
      )}
    </button>
  );
};

export default DarkModeToggle;
