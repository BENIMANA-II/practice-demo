import axios from "axios";

// Single axios instance. withCredentials sends the session cookie on every request.
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// On a 401 (session expired/missing), bounce to the login page.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const path = window.location.pathname;
    const onPublic = ["/login", "/register", "/recover", "/"].includes(path);
    if (status === 401 && !onPublic) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
