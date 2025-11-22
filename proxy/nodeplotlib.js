import fs from 'fs';
import { writeFile } from 'fs/promises';
import plotly from 'plotly';

const raw = fs.readFileSync('./data.json', 'utf-8')
  .split('\n')
  .filter(Boolean)
  .map(line => JSON.parse(line));

// Extract useful metrics
let lat3000 = [];
let lat3002 = [];
let errors = 0;
let total = 0;
let timestamps = [];

raw.forEach(entry => {
  if (!entry.metrics) return;

  const m = entry.metrics;

  // Iterate over metrics
  for (const key in m) {
    const metric = m[key];

    if (key.includes('latency_3000') && metric.type === 'trend') {
      lat3000.push(metric.values.avg);
      timestamps.push(entry.time);
    }

    if (key.includes('latency_3002') && metric.type === 'trend') {
      lat3002.push(metric.values.avg);
    }

    if (key === 'errors' && metric.type === 'rate') {
      errors += metric.values.count;
    }

    if (key === 'vus') {
      total++;
    }
  }
});

// Summary Table
console.log("\n===== SUMMARY =====");
console.table([
  { metric: "Total samples", value: total },
  { metric: "Errors", value: errors },
  { metric: "Error rate (%)", value: ((errors / total) * 100).toFixed(2) }
]);

// Graph 1 — Latency comparison
const latencyGraph = {
  data: [
    {
      x: timestamps,
      y: lat3000,
      type: "scatter",
      name: "Latency 3000"
    },
    {
      x: timestamps,
      y: lat3002,
      type: "scatter",
      name: "Latency 3002"
    }
  ],
  layout: {
    title: "Latency Comparison",
    xaxis: { title: "Timestamp" },
    yaxis: { title: "Latency (ms)" }
  }
};

// Graph 2 — Error Rate
const errorGraph = {
  data: [
    {
      x: ["Errors"],
      y: [errors],
      type: "bar",
      name: "Error Count"
    }
  ],
  layout: {
    title: "Error Count",
    yaxis: { title: "Count" }
  }
};

async function generate() {
  // Write HTML file
  const html = `
  <html>
  <head>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  </head>
  <body>
    <div id="lat"></div>
    <div id="err"></div>
    <script>
      var latency = ${JSON.stringify(latencyGraph)};
      var error = ${JSON.stringify(errorGraph)};
      Plotly.newPlot("lat", latency.data, latency.layout);
      Plotly.newPlot("err", error.data, error.layout);
    </script>
  </body>
  </html>
  `;

  await writeFile("report.html", html);
  console.log("HTML report generated: report.html");
}

generate();
