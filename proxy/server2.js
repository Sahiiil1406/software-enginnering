import express from 'express';


const app = express();
const PORT = 3002;

app.get('/', (req, res) => {
  res.send('Hello from Server 2');
});

app.listen(PORT, () => {
  console.log(`Server 2 is running on http://localhost:${PORT}`);
});