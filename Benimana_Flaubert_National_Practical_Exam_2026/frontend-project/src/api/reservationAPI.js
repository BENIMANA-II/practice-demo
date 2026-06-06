import axiosClient from "./axiosClient";

export const reservationAPI = {
  list: (search) => axiosClient.get("/reservations", { params: { search } }),
  create: (body) => axiosClient.post("/reservations", body),
  update: (id, body) => axiosClient.put(`/reservations/${id}`, body),
  remove: (id) => axiosClient.delete(`/reservations/${id}`),
};
