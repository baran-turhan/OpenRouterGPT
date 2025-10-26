export const serverConfig = {
  backendBaseUrl: process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000',
  telemetryService: process.env.OTEL_SERVICE_NAME ?? 'madlen-chat-frontend'
};
