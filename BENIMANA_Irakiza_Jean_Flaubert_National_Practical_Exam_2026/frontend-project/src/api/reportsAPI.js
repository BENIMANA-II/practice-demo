// Calls the backend report endpoints (dashboard totals and the three stock reports).
import axiosClient from './axiosClient';

export async function getDashboard() {
  const res = await axiosClient.get('/reports/dashboard');
  return res.data.data;
}

export async function getAvailableStockReport(period) {
  const res = await axiosClient.get('/reports/available-stock', { params: { period } });
  return res.data.data;
}

export async function getStockInReport(period) {
  const res = await axiosClient.get('/reports/stock-in', { params: { period } });
  return res.data.data;
}

export async function getStockOutReport(period) {
  const res = await axiosClient.get('/reports/stock-out', { params: { period } });
  return res.data.data;
}
