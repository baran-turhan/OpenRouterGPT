import { initFrontendTelemetry } from "./src/server/telemetry";

export function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }
  initFrontendTelemetry();
}
