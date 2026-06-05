import axiosClient from "./axiosClient";

export const authAPI = {
  register: (body) => axiosClient.post("/auth/register", body),
  login: (body) => axiosClient.post("/auth/login", body),
  logout: () => axiosClient.post("/auth/logout"),
  me: () => axiosClient.get("/auth/me"),
  recoverVerify: (body) => axiosClient.post("/auth/recover/verify", body),
  recoverReset: (body) => axiosClient.post("/auth/recover/reset", body),
};
