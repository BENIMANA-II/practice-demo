// Calls the backend warehouse endpoints (create, list, update, delete).
import axiosClient from './axiosClient';

export async function createWarehouse(payload) {
  const res = await axiosClient.post('/warehouses', payload);
  return res.data.data;
}

export async function getAllWarehouses() {
  const res = await axiosClient.get('/warehouses');
  return res.data.data;
}

export async function updateWarehouse(id, payload) {
  const res = await axiosClient.put(`/warehouses/${id}`, payload);
  return res.data.data;
}

export async function deleteWarehouse(id) {
  const res = await axiosClient.delete(`/warehouses/${id}`);
  return res.data.data;
}
