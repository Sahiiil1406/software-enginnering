// proxy.js
import http from "http";
import httpProxy from "http-proxy";

const proxy = httpProxy.createProxyServer({});
const servers = ["http://localhost:3002", "http://localhost:3001"];

let i = 0;

const server = http.createServer((req, res) => {
  const target = servers[i % servers.length];
  i++;

  console.log(`Routing ${req.url} --> ${target}`);

  proxy.web(req, res, { target }, (err) => {
    console.error("Proxy error:", err);
    res.writeHead(502);
    res.end("Bad Gateway");
  });
});

server.listen(3000, () => console.log("Proxy running on http://localhost:3000"));
