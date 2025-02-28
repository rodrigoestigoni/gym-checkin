// ChallengeContext.jsx
import React, { createContext, useState, useContext } from 'react';

const ChallengeContext = createContext();

export const ChallengeProvider = ({ children }) => {
  const [activeChallenge, setActiveChallenge] = useState(null);

  return (
    <ChallengeContext.Provider value={{ activeChallenge, setActiveChallenge }}>
      {children}
    </ChallengeContext.Provider>
  );
};

export const useChallenge = () => useContext(ChallengeContext);