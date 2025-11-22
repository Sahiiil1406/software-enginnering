import express from 'express';


const app = express();
const PORT = 3001;

app.get('/', (req, res) => {
  res.send('Hello from Server 1');
});

app.listen(PORT, () => {
  console.log(`Server 1 is running on http://localhost:${PORT}`);
});