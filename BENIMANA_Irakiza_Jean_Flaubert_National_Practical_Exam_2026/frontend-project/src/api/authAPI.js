// Calls the backend auth endpoints (register, login, logout, me, recovery).
import axiosClient from './axiosClient';

// Each function returns the payload inside the { data } envelope so callers get the object directly.
export async function register(payload) {
  const res = await axiosClient.post('/auth/register', payload);
  return res.data.data;
}

export async function login(credentials) {
  const res = await axiosClient.post('/auth/login', credentials);
  return res.data.data;
}

export async function logout() {
  const res = await axiosClient.post('/auth/logout');
  return res.data.data;
}

export async function getMe() {
  const res = await axiosClient.get('/auth/me');
  return res.data.data;
}

export async function recoverVerify(payload) {
  const res = await axiosClient.post('/auth/recover/verify', payload);
  return res.data.data;
}

export async function recoverReset(payload) {
  const res = await axiosClient.post('/auth/recover/reset', payload);
  return res.data.data;
}
