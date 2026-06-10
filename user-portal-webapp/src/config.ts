const getRequiredEnv = (key: string, value: string | undefined): string => {
  const normalized = value?.trim().replace(/\/+$/, "");

  if (normalized) {
    return normalized;
  }

  throw new Error(`${key} must be set`);
};

export const apiBaseUrl = getRequiredEnv(
  "VITE_API_BASE_URL",
  import.meta.env.VITE_API_BASE_URL
);
