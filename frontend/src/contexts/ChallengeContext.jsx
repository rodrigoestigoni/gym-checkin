// ChallengeContext.jsx
import React, { createContext, useState, useContext, useCallback, useMemo, useEffect } from 'react';

const ChallengeContext = createContext();

export const ChallengeProvider = ({ children }) => {
  const [activeChallenge, setActiveChallengeState] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  
  // Use useCallback para evitar a recriação da função em cada renderização
  const setActiveChallenge = useCallback((challenge) => {
    if (!challenge) {
      setActiveChallengeState(null);
      setLastUpdated(Date.now());
      return;
    }
    
    // Verificar se é o mesmo desafio para evitar atualizações desnecessárias
    setActiveChallengeState(current => {
      if (current && current.id === challenge.id) {
        // Mesmo se for o mesmo ID, podemos ter recebido dados atualizados
        // Então vamos fazer uma verificação mais detalhada
        const needsUpdate = JSON.stringify(current) !== JSON.stringify(challenge);
        
        if (needsUpdate) {
          console.log("Atualizando dados do mesmo desafio", challenge.id);
          setLastUpdated(Date.now());
          return challenge;
        }
        
        // Se realmente não mudou nada, retorna o current para evitar re-renderização
        return current;
      }
      
      // É um novo desafio, atualiza e marca o timestamp
      console.log("Trocando para novo desafio ativo no contexto", challenge.id);
      setLastUpdated(Date.now());
      return challenge;
    });
  }, []);
  
  // Função para limpar o desafio ativo
  const clearActiveChallenge = useCallback(() => {
    setActiveChallengeState(null);
    setLastUpdated(Date.now());
  }, []);

  // Use useMemo para o valor do contexto para evitar re-renderizações desnecessárias
  const contextValue = useMemo(() => ({
    activeChallenge, 
    setActiveChallenge,
    clearActiveChallenge,
    lastUpdated
  }), [activeChallenge, setActiveChallenge, clearActiveChallenge, lastUpdated]);

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