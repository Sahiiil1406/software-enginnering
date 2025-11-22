async function loadData() {
  const res = await fetch("dummy.json");
  const data = await res.json();

  const s1 = data.scenario_1_single_server;
  const s2 = data.scenario_2_load_balanced;
    console.log(s1, s2);
  // ==========================
  // BUILD SUMMARY TABLE (HTML)
  // ==========================
  const summaryHTML = `
    <table>
      <tr>
        <th>Metric</th>
        <th>Single Server</th>
        <th>Load Balanced</th>
      </tr>
      <tr>
        <td>Total Requests</td>
        <td>${s1.totals.requests}</td>
        <td>${s2.totals.requests}</td>
      </tr>
      <tr>
        <td>Success</td>
        <td>${s1.totals.success}</td>
        <td>${s2.totals.success}</td>
      </tr>
      <tr>
        <td>Failed</td>
        <td>${s1.totals.failed}</td>
        <td>${s2.totals.failed}</td>
      </tr>
      <tr>
        <td>Success Rate</td>
        <td>${s1.totals.successRate}%</td>
        <td>${s2.totals.successRate}%</td>
      </tr>
      <tr>
        <td>Average Latency</td>
        <td>${s1.latency.avg} ms</td>
        <td>${s2.latency.avg} ms</td>
      </tr>
      <tr>
        <td>P99 Latency</td>
        <td>${s1.latency.p99} ms</td>
        <td>${s2.latency.p99} ms</td>
      </tr>
      <tr>
        <td>CPU Avg %</td>
        <td>${s1.system.cpu_avg}%</td>
        <td>${(s2.servers["3002"].cpu_avg + s2.servers["3003"].cpu_avg) / 2}%</td>
      </tr>
    </table>
  `;
  document.getElementById("summaryTable").innerHTML = summaryHTML;

  // ==========================
  // CHART 1: LATENCY CURVE
  // ==========================
  new Chart(document.getElementById("latencyChart"), {
    type: "line",
    data: {
      labels: ["avg", "p90", "p95", "p99", "max"],
      datasets: [
        {
          label: "Single Server",
          data: [
            s1.latency.avg,
            s1.latency.p90,
            s1.latency.p95,
            s1.latency.p99,
            s1.latency.max,
          ],
          borderColor: "red",
          tension: 0.2
        },
        {
          label: "Load Balanced",
          data: [
            s2.latency.avg,
            s2.latency.p90,
            s2.latency.p95,
            s2.latency.p99,
            s2.latency.max,
          ],
          borderColor: "blue",
          tension: 0.2
        }
      ]
    }
  });

  // ==========================
  // CHART 2: SUCCESS VS FAILED
  // ==========================
  new Chart(document.getElementById("successFailChart"), {
    type: "bar",
    data: {
      labels: ["Single Success", "Single Fail", "LB Success", "LB Fail"],
      datasets: [
        {
          label: "Requests",
          data: [
            s1.totals.success,
            s1.totals.failed,
            s2.totals.success,
            s2.totals.failed
          ],
          backgroundColor: ["green", "red", "green", "red"]
        }
      ]
    }
  });

  // ==========================
  // CHART 3: CPU USAGE
  // ==========================
  new Chart(document.getElementById("cpuChart"), {
    type: "bar",
    data: {
      labels: ["Single CPU", "LB 3002 CPU", "LB 3003 CPU"],
      datasets: [
        {
          label: "CPU %",
          data: [
            s1.system.cpu_avg,
            s2.servers["3002"].cpu_avg,
            s2.servers["3003"].cpu_avg
          ],
          backgroundColor: ["orange", "blue", "blue"]
        }
      ]
    }
  });

  // ==========================
  // CHART 4: MEMORY USAGE
  // ==========================
  new Chart(document.getElementById("memoryChart"), {
    type: "bar",
    data: {
      labels: ["Single Mem", "LB 3002 Mem", "LB 3003 Mem"],
      datasets: [
        {
          label: "Memory MB",
          data: [
            s1.system.mem_avg,
            s2.servers["3002"].mem_avg,
            s2.servers["3003"].mem_avg
          ],
          backgroundColor: ["purple", "cyan", "cyan"]
        }
      ]
    }
  });

  // ==========================
  // CHART 5: LOAD DISTRIBUTION PIE
  // ==========================
  new Chart(document.getElementById("loadDistChart"), {
    type: "pie",
    data: {
      labels: ["Server 3002", "Server 3003"],
      datasets: [
        {
          data: [
            s2.servers["3002"].requests,
            s2.servers["3003"].requests
          ],
          backgroundColor: ["#4CAF50", "#2196F3"]
        }
      ]
    }
  });
}

loadData();
