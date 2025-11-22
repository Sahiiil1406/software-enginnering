import fs from 'fs';
import { plot, stack } from 'nodeplotlib';


const raw = fs.readFileSync('data.json', 'utf-8');
const data = JSON.parse(raw);


const t3002 = data.filter(d => d.endpoint === 3002).map(d => d.time);
const t3000 = data.filter(d => d.endpoint === 3000).map(d => d.time);


stack([
{
x: [...Array(t3002.length).keys()],
y: t3002,
type: 'line',
name: 'Latency 3002',
},
{
x: [...Array(t3000.length).keys()],
y: t3000,
type: 'line',
name: 'Latency 3000',
}
]);


plot();