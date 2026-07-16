import axios from "axios";

// Plain axios instance for public/participant endpoints that don't require admin auth
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api.platform.com/v1",
});

export default publicApi;
