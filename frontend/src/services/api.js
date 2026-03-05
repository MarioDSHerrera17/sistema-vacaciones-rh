const API_URL = "http://localhost:3000";

export const obtenerAPI = async () => {
  const res = await fetch(API_URL);
  return res.json();
};