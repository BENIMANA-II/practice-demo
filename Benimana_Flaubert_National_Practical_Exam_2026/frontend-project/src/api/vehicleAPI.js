import axiosClient from "./axiosClient";

export const vehicleAPI = {
  list: (search) => axiosClient.get("/vehicles", { params: { search } }),
  create: (body) => axiosClient.post("/vehicles", body),
  update: (plate, body) => axiosClient.put(`/vehicles/${encodeURIComponent(plate)}`, body),
  remove: (plate) => axiosClient.delete(`/vehicles/${encodeURIComponent(plate)}`),
};
