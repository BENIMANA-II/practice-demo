// Sets up the shared axios instance every API call uses (sends the session cookie, handles 401s).
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // send the session cookie on every request
});

const PUBLIC_PATHS = ['/', '/login', '/register', '/recover'];

// On 401, bounce to /login — but never from a public page or the /me hydration call,
// so an unauthenticated visitor on a public route is not redirected.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const isMeCheck = url.includes('/auth/me');
    const onPublicPage = PUBLIC_PATHS.includes(window.location.pathname);
    if (status === 401 && !isMeCheck && !onPublicPage) {
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

// Normalizes an axios error into the server's { error } message (or a network fallback).
export function extractError(error) {
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.request && !error?.response) return 'Unable to connect to the server. Please try again.';
  return 'Something went wrong. Please try again.';
}

export default axiosClient;
