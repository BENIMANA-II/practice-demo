import axiosClient from "./axiosClient";

export const customerAPI = {
  list: (search) => axiosClient.get("/customers", { params: { search } }),
  create: (body) => axiosClient.post("/customers", body),
  update: (id, body) => axiosClient.put(`/customers/${id}`, body),
  remove: (id) => axiosClient.delete(`/customers/${id}`),
};
