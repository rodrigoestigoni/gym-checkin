// frontend/src/components/DarkModeToggle.jsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";

const DarkModeToggle = () => {
  // Definir o estado inicial com base no localStorage ou preferência do sistema
  const [darkMode, setDarkMode] = useState(() => {
    // Primeiro, tente obter do localStorage
    const savedPreference = localStorage.getItem("darkMode");
    
    if (savedPreference !== null) {
      return savedPreference === "true";
    }
    
    // Se não houver configuração salva, verificar preferência do sistema
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Aplicar o modo a qualquer mudança no estado
  useEffect(() => {
    // Aplicar a classe dark ao elemento html
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    // Salvar a preferência no localStorage
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  // Ouvir as mudanças na preferência do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Definir uma função de listener para mudanças
    const handleChange = (e) => {
      // Só mudaremos automaticamente se o usuário não tiver salvo uma preferência
      if (localStorage.getItem("darkMode") === null) {
        setDarkMode(e.matches);
      }
    };
    
    // Adicionar o listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback para navegadores mais antigos
      mediaQuery.addListener(handleChange);
    }
    
    // Limpar o listener
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback para navegadores mais antigos
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Alternar entre os modos
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      title={darkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-label={darkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      {darkMode ? (
        <FontAwesomeIcon icon={faSun} className="text-yellow-500" />
      ) : (
        <FontAwesomeIcon icon={faMoon} className="text-gray-700" />
      )}
    </button>
  );
};

export default DarkModeToggle;