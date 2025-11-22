// File: loadtest.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';



// Metrics
const latency3002 = new Trend('latency_3002');
const latency3000 = new Trend('latency_3000');
const errorRate = new Rate('errors');
const rpsCounter = new Counter('rps');


// Function hitting localhost:3002
export function hit3002() {
const res = http.get('http://localhost:3002');
latency3002.add(res.timings.duration);
rpsCounter.add(1);
const ok = check(res, { 'status is 200': (r) => r.status === 200 });
errorRate.add(!ok);
return { endpoint: 3002, status: res.status, time: res.timings.duration };
}


// Function hitting localhost:3000
export function hit3000() {
const res = http.get('http://localhost:3000');
latency3000.add(res.timings.duration);
rpsCounter.add(1);
const ok = check(res, { 'status is 200': (r) => r.status === 200 });
errorRate.add(!ok);
return { endpoint: 3000, status: res.status, time: res.timings.duration };
}


// Test options (stretch, peak, stress)
export const options = {
scenarios: {
stretch_test: {
executor: 'ramping-vus',
startVUs: 1,
stages: [
{ duration: '20s', target: 50 },
{ duration: '20s', target: 100 },
{ duration: '10s', target: 0 },
],
exec: 'stretch',
},
peak_test: {
executor: 'constant-vus',
vus: 150,
duration: '30s',
exec: 'peak',
},
stress_test: {
executor: 'ramping-arrival-rate',
startRate: 5,
timeUnit: '1s',
preAllocatedVUs: 50,
maxVUs: 200,
stages: [
{ target: 200, duration: '40s' },
{ target: 300, duration: '30s' },
],
exec: 'stress',
},
},
};


export function stretch() {
const d1 = hit3002();
const d2 = hit3000();

sleep(1);
}


export function peak() {
const d1 = hit3002();
const d2 = hit3000();

}


export function stress() {
const d = Math.random() > 0.5 ? hit3002() : hit3000();

}