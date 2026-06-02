export const API_BASE_URL =
  typeof window !== "undefined" && window.location.hostname === "internal-v2.brilliant.com.bd"
    ? "https://internal-v2.brilliant.com.bd"
    : "http://36.255.70.9:8002";
