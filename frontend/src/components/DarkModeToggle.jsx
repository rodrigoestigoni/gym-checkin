// frontend/src/components/DarkModeToggle.jsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";

const DarkModeToggle = () => {
  const [darkMode, setDarkMode] = useState(true); // Modo dark como padrão

  useEffect(() => {
    const storedDark = localStorage.getItem("darkMode");
    if (storedDark !== null) {
      const isDark = storedDark === "true";
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      // Se não há valor armazenado, usa o padrão (darkMode = true)
      setDarkMode(true);
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", newDarkMode.toString());
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