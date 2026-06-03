// Calls the backend product endpoints (create, list, update, delete).
import axiosClient from './axiosClient';

export async function createProduct(payload) {
  const res = await axiosClient.post('/products', payload);
  return res.data.data;
}

export async function getAllProducts() {
  const res = await axiosClient.get('/products');
  return res.data.data;
}

export async function updateProduct(id, payload) {
  const res = await axiosClient.put(`/products/${id}`, payload);
  return res.data.data;
}

export async function deleteProduct(id) {
  const res = await axiosClient.delete(`/products/${id}`);
  return res.data.data;
}
