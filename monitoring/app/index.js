const express = require("express");
const client = require("prom-client");   // Prometheus client
const app = express();
const PORT = 3000;

// Default metrics (CPU, event loop, heap, etc.)
client.collectDefaultMetrics();

// Custom metric examples
const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route"]
});

const responseTimeHistogram = new client.Histogram({
  name: "http_response_time_seconds",
  help: "Response time in seconds",
  labelNames: ["route"]
});

// Middleware for metrics
app.use((req, res, next) => {
  httpRequestCounter.inc({ method: req.method, route: req.path });
  next();
});

// Example route
app.get("/", (req, res) => {
  const end = responseTimeHistogram.startTimer({ route: "/" });
  setTimeout(() => {
    end();
    res.send("Hello from Express with Prometheus!");
  }, Math.random() * 300); // mimic real delays
});

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
