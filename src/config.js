export const API_BASE_URL =
  typeof window !== "undefined" && window.location.hostname === "support.brilliant.com.bd"
    ? "https://support.brilliant.com.bd"
    : "https://staging-ticketing.brilliant.com.bd";
