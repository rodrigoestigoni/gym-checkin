// api.js
export const fetchProtectedData = async (url, options = {}, user, navigate, setUser) => {
  try {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
      ...(user && { Authorization: `Bearer ${user.token}` }),
    };

    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      // Token inválido: desloga o usuário
      localStorage.removeItem("user");
      setUser(null);
      navigate("/login");
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Erro na requisição:", error);
    throw error;
  }
};
