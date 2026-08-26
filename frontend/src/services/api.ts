export type HealthResponse = {
  status: string;
  service: string;
  environment: string;
  database: {
    status: string;
  };
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}
