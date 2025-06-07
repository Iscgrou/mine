const API_BASE_URL = "/api";

export function getApiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}
