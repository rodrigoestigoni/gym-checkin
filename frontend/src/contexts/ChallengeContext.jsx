// ChallengeContext.jsx - Corrigido para evitar re-renderizações desnecessárias
import React, { createContext, useState, useContext, useCallback } from 'react';

const ChallengeContext = createContext();

export const ChallengeProvider = ({ children }) => {
  const [activeChallenge, setActiveChallenge] = useState(null);
  
  // Use useCallback para evitar a recriação da função em cada renderização
  const updateActiveChallenge = useCallback((challenge) => {
    if (!challenge) {
      setActiveChallenge(null);
      return;
    }
    
    // Verificar se é o mesmo desafio para evitar atualizações desnecessárias
    setActiveChallenge(current => {
      if (current && current.id === challenge.id) {
        return current; // Não atualiza se for o mesmo ID
      }
      console.log("Atualizando desafio ativo no contexto", challenge.id);
      return challenge;
    });
  }, []);
  
  // Função para limpar o desafio ativo
  const clearActiveChallenge = useCallback(() => {
    setActiveChallenge(null);
  }, []);

  return (
    <ChallengeContext.Provider value={{ 
      activeChallenge, 
      setActiveChallenge: updateActiveChallenge,
      clearActiveChallenge
    }}>
      {children}
    </ChallengeContext.Provider>
  );
};

export const useChallenge = () => useContext(ChallengeContext);