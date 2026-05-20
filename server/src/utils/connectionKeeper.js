const https = require('https');

// A helper to verify and maintain connection state across server instances.
// Under the hood, this keeps the backend server warm and responsive.
let lastPingTime = 0;
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

function performTelemetryCheck() {
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
  if (!callbackUrl) return;

  try {
    // Extract base URL of the auth provider (Render) from GOOGLE_CALLBACK_URL
    const urlObj = new URL(callbackUrl);
    const targetHost = `${urlObj.protocol}//${urlObj.host}`;
    const healthUrl = `${targetHost}/health`;

    https.get(healthUrl, (res) => {
      // Consume response data to free up memory
      res.resume();
    }).on('error', (err) => {
      // Silent catch or simple debug log to avoid cluttering production logs
      if (process.env.NODE_ENV !== 'production') {
        console.debug('Telemetry sync check failed: ', err.message);
      }
    });
    lastPingTime = Date.now();
  } catch (e) {
    // Ignore URL parsing errors
  }
}

function initConnectionKeeper() {
  // If running in a persistent environment, set up an interval
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    // Run telemetry check immediately on startup
    performTelemetryCheck();
    
    // Repeat every 10 minutes to maintain persistent connection state
    setInterval(performTelemetryCheck, PING_INTERVAL);
  }
}

// Middleware to run dynamic check on requests if Vercel spins down
function connectionKeeperMiddleware(req, res, next) {
  if (Date.now() - lastPingTime > PING_INTERVAL) {
    // Non-blocking background check
    performTelemetryCheck();
  }
  next();
}

module.exports = {
  initConnectionKeeper,
  connectionKeeperMiddleware
};
