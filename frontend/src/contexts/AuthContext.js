// frontend/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, useAuth } from '../services/api';

// Criar o contexto
const AuthContext = createContext(null);

// Hook personalizado para usar o contexto
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Componente Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined); // undefined = ainda carregando, null = não autenticado
  const [loading, setLoading] = useState(true);
  const { isTokenValid } = useAuth();

  // Verificar usuário no localStorage e validar token no carregamento inicial
  useEffect(() => {
    const initializeAuth = () => {
      const storedUser = localStorage.getItem('user');
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          if (isTokenValid(parsedUser.token)) {
            setUser(parsedUser);
          } else {
            // Token expirado, limpa o localStorage
            localStorage.removeItem('user');
            setUser(null);
          }
        } catch (error) {
          console.error('Erro ao analisar usuário armazenado:', error);
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    };
    
    initializeAuth();
  }, [isTokenValid]);

  // Função de login
  const login = async (username, password) => {
    try {
      const res = await api.login(username, password);
      
      if (res.ok) {
        const data = await res.json();
        
        // Criar objeto de usuário
        const userData = {
          id: data.user.id,
          username: data.user.username,
          status: data.user.status,
          token: data.access_token,
          is_admin: data.user.is_admin,
          profile_image: data.user.profile_image,
        };
        
        // Salvar no localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Atualizar estado
        setUser(userData);
        
        return { success: true, user: userData };
      } else {
        const errorData = await res.json();
        return { success: false, error: errorData.detail || 'Credenciais incorretas' };
      }
    } catch (error) {
      console.error('Erro de login:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  };

  // Função de logout
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // Função para atualizar dados do usuário
  const updateUserData = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  // Valores a serem fornecidos pelo contexto
  const value = {
    user,
    loading,
    login,
    logout,
    updateUserData,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;