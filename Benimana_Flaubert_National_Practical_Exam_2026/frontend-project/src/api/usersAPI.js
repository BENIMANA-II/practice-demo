import axiosClient from "./axiosClient";

// Admin-only endpoints for approving user accounts.
export const usersAPI = {
  list: () => axiosClient.get("/users"),
  approve: (id) => axiosClient.put(`/users/${id}/approve`),
};
