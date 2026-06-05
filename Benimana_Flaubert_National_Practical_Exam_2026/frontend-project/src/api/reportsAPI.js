import axiosClient from "./axiosClient";

export const reportsAPI = {
  dashboard: () => axiosClient.get("/reports/dashboard"),
  reservations: (from, to) =>
    axiosClient.get("/reports/reservations", { params: { from, to } }),
};
