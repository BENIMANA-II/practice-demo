// Calls the backend transaction endpoints (create, list, update, delete).
import axiosClient from './axiosClient';

export async function createTransaction(payload) {
  const res = await axiosClient.post('/transactions', payload);
  return res.data.data;
}

export async function getAllTransactions() {
  const res = await axiosClient.get('/transactions');
  return res.data.data;
}

export async function updateTransaction(id, payload) {
  const res = await axiosClient.put(`/transactions/${id}`, payload);
  return res.data.data;
}

export async function deleteTransaction(id) {
  const res = await axiosClient.delete(`/transactions/${id}`);
  return res.data.data;
}
