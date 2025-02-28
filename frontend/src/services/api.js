// frontend/src/services/api.js
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Objeto para armazenar requisições em andamento
const pendingRequests = {};

// Cache para armazenar respostas anteriores
const responseCache = {};

export const api = {
  // Auth
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    
    const response = await fetch(`${API_URL}/token`, {
      method: "POST",
      body: formData,
    });
    return response;
  },
  
  register: async (username, password) => {
    const response = await fetch(`${API_URL}/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, is_admin: false }),
    });
    return response;
  },
  
  // Checkins
  getCheckins: async (userId, token, skip = 0, limit = 10) => {
    const response = await fetch(`${API_URL}/users/${userId}/checkins/?skip=${skip}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },
  
  getWeeklyCheckins: async (userId, token, weekOffset = 0) => {
    const response = await fetch(`${API_URL}/users/${userId}/checkins/week/?week_offset=${weekOffset}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },
  
  createCheckin: async (token, payload) => {
    const response = await fetch(`${API_URL}/checkin/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return response;
  },
  
  updateCheckin: async (token, checkinId, payload) => {
    const response = await fetch(`${API_URL}/checkins/${checkinId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return response;
  },
  
  deleteCheckin: async (token, checkinId) => {
    const response = await fetch(`${API_URL}/checkins/${checkinId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },
  
  // Rankings
  getWeeklyRanking: async () => {
    const response = await fetch(`${API_URL}/ranking/weekly`);
    return response;
  },
  
  getOverallRanking: async () => {
    const response = await fetch(`${API_URL}/ranking/overall`);
    return response;
  },
  
  // Challenges
  getChallenges: async (token) => {
    const response = await fetch(`${API_URL}/challenges/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },
  
  getChallengeById: async (token, challengeId) => {
    const response = await fetch(`${API_URL}/challenges/${challengeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },
  
  getChallengeByCode: async (token, code) => {
    const response = await fetch(`${API_URL}/challenges/invite/${code}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },
  
  createChallenge: async (token, payload) => {
    const response = await fetch(`${API_URL}/challenges/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return response;
  },
  
  updateChallenge: async (token, challengeId, payload) => {
    const response = await fetch(`${API_URL}/challenges/${challengeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return response;
  },
  
  deleteChallenge: async (token, challengeId) => {
    const response = await fetch(`${API_URL}/challenges/${challengeId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },
  
  joinChallenge: async (token, challengeId) => {
    const response = await fetch(`${API_URL}/challenges/${challengeId}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  },
  
  getChallengeParticipants: async (token, challengeId) => {
    const response = await fetch(`${API_URL}/challenges/${challengeId}/participants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },
  
  getParticipatedChallenges: async (token) => {
    const response = await fetch(`${API_URL}/challenge-participation/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },
  
  getChallengeRanking: async (token, challengeId, period = "weekly") => {
    const response = await fetch(`${API_URL}/challenges/${challengeId}/ranking?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },
  
  // Profile
  updateProfile: async (token, formData) => {
    const response = await fetch(`${API_URL}/users/me`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return response;
  },
};

// Hook de autenticação
export const useAuth = () => {
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      return null;
    }
  };
  
  const isTokenValid = (token) => {
    if (!token) return false;
    
    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.exp) {
      return false;
    }
    
    // O exp é em segundos, precisa converter para ms
    return decodedToken.exp * 1000 > Date.now();
  };
  
  return {
    isTokenValid,
    parseJwt
  };
};