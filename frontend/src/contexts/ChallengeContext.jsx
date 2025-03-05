// ChallengeContext.jsx - Corrigido para evitar re-renderizações desnecessárias
import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';

const ChallengeContext = createContext();

export const ChallengeProvider = ({ children }) => {
  const [activeChallenge, setActiveChallengeState] = useState(null);
  
  // Use useCallback para evitar a recriação da função em cada renderização
  const setActiveChallenge = useCallback((challenge) => {
    if (!challenge) {
      setActiveChallengeState(null);
      return;
    }
    
    // Verificar se é o mesmo desafio para evitar atualizações desnecessárias
    setActiveChallengeState(current => {
      if (current && current.id === challenge.id) {
        // Se já temos o mesmo desafio, retorna o current para evitar re-renderização
        return current;
      }
      console.log("Atualizando desafio ativo no contexto", challenge.id);
      return challenge;
    });
  }, []);
  
  // Função para limpar o desafio ativo
  const clearActiveChallenge = useCallback(() => {
    setActiveChallengeState(null);
  }, []);

  // Use useMemo para o valor do contexto para evitar re-renderizações desnecessárias
  const contextValue = useMemo(() => ({
    activeChallenge, 
    setActiveChallenge,
    clearActiveChallenge
  }), [activeChallenge, setActiveChallenge, clearActiveChallenge]);

  return (
    <ChallengeContext.Provider value={contextValue}>
      {children}
    </ChallengeContext.Provider>
  );
};

export const useChallenge = () => {
  const context = useContext(ChallengeContext);
  if (!context) {
    throw new Error('useChallenge deve ser usado dentro de um ChallengeProvider');
  }
  return context;
};