import app from './app';
import { config } from './config';
import { initTelemetry } from './telemetry';

initTelemetry();

const port = config.port;
app.listen(port, () => {
});
